import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { ApiError, customFetch } from '#/shared/api/mutator'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import {
  applyBackendFieldErrors,
  FieldRow,
  firstErrorMessage,
  useAppForm,
} from '#/shared/ui/form'

import { MarkAsPaidConfirmDialog } from './MarkAsPaidConfirmDialog'
import { usePaymentAnalytics } from './usePaymentAnalytics'
import type { MarkAsPaidStep } from './usePaymentAnalytics'

type SpeedBonusReason =
  | 'included'
  | 'not_applied_deadline_missed'
  | 'not_applicable_multistage'
  | 'not_declared'
  | 'prorated_bundle'

interface PaymentSuggestion {
  suggested_amount: string
  currency?: string
  speed_bonus_reason: SpeedBonusReason
}

interface ApiResponse<T> {
  data: T
  status: number
}

interface MarkAsPaidSidesheetProps {
  open: boolean
  deliverableId: string | null
  creatorName: string
  onOpenChange: (open: boolean) => void
}

const amountWithAtMostTwoDecimals = /^\d+(?:\.\d{0,2})?$/

function getBackendToastMessages(): Record<string, string> {
  return {
    deliverable_not_completed: t`This deliverable is not ready to be marked as paid`,
    deliverable_already_paid: t`This deliverable was already marked as paid`,
    not_brand_owner: t`Only the workspace owner can mark payments`,
  }
}

function createMarkAsPaidSchema() {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, t`Enter an amount greater than 0.`)
      .regex(amountWithAtMostTwoDecimals, t`Use up to 2 decimal places.`)
      .refine(
        (value) => {
          const numericAmount = Number(value)
          return Number.isFinite(numericAmount) && numericAmount > 0
        },
        t`Enter an amount greater than 0.`,
      ),
  })
}

function getPaymentSuggestionQueryKey(deliverableId: string | null) {
  return ['payment-suggestion', deliverableId] as const
}

async function fetchPaymentSuggestion(
  deliverableId: string,
): Promise<PaymentSuggestion> {
  const response = await customFetch<ApiResponse<PaymentSuggestion>>(
    `/v1/deliverables/${encodeURIComponent(deliverableId)}/payment-suggestion`,
  )
  return response.data
}

function usePaymentSuggestion(deliverableId: string | null, open: boolean) {
  return useQuery({
    queryKey: getPaymentSuggestionQueryKey(deliverableId),
    queryFn: () => fetchPaymentSuggestion(deliverableId ?? ''),
    enabled: open && deliverableId != null,
    retry: false,
  })
}

interface MarkAsPaidBody {
  amount: string
}

function useMarkDeliverableAsPaid(deliverableId: string | null) {
  return useMutation({
    mutationFn: (body: MarkAsPaidBody) => {
      if (!deliverableId) {
        throw new Error(t`Missing deliverable`)
      }

      return customFetch<ApiResponse<unknown>>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/mark-as-paid`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      )
    },
  })
}

function getSpeedBonusNote(reason: SpeedBonusReason): string {
  const notes: Record<SpeedBonusReason, string> = {
    included: t`Includes the speed bonus for this deliverable.`,
    not_applied_deadline_missed: t`Speed bonus is not included because the deadline was missed.`,
    not_applicable_multistage: t`Speed bonus does not apply to multistage offers.`,
    not_declared: t`No speed bonus was declared for this offer.`,
    prorated_bundle: t`Speed bonus was prorated across the bundle deliverables.`,
  }

  return notes[reason]
}

function getLoadErrorMessage(error: Error | null): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return t`Only the workspace owner can mark payments`
    if (error.status === 404) return t`This deliverable could not be found.`
    if (error.status === 409) {
      const mapped = getBackendToastMessages()[error.code]
      return mapped ?? t`This deliverable cannot be marked as paid yet.`
    }
  }

  return t`Payment suggestion could not be loaded.`
}

function normalizeInvalidAmountError(error: ApiError): ApiError {
  if (error.status !== 422 || error.code !== 'invalid_amount') return error
  if (error.details?.field_errors?.amount?.length) return error

  return new ApiError(error.status, error.code, error.message, {
    field_errors: {
      amount: [error.message || t`Use a valid amount.`],
    },
  })
}

export function MarkAsPaidSidesheet({
  open,
  deliverableId,
  creatorName,
  onOpenChange,
}: MarkAsPaidSidesheetProps) {
  const [step, setStep] = useState<MarkAsPaidStep>('amount')
  const openedTrackedRef = useRef(false)
  const amountOverriddenRef = useRef(false)
  const closingAfterSuccessRef = useRef(false)
  const cancellationTrackedRef = useRef(false)
  const previousOpenRef = useRef(open)
  const suggestionAppliedRef = useRef<string | null>(null)

  const analytics = usePaymentAnalytics(deliverableId)
  const suggestionQuery = usePaymentSuggestion(deliverableId, open)
  const mutation = useMarkDeliverableAsPaid(deliverableId)
  const markAsPaidSchema = createMarkAsPaidSchema()

  const form = useAppForm({
    defaultValues: { amount: '' },
    validators: { onChange: markAsPaidSchema },
    onSubmit: async ({ value }) => {
      if (step === 'amount') {
        setStep('final_confirmation')
        return
      }

      try {
        await mutation.mutateAsync({ amount: value.amount.trim() })
        closingAfterSuccessRef.current = true
        onOpenChange(false)
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 422 && error.code === 'invalid_amount') {
            setStep('amount')
            applyBackendFieldErrors(form, normalizeInvalidAmountError(error), {
              fallback: (msg) => toast.error(msg),
            })
            return
          }

          const mapped = getBackendToastMessages()[error.code]
          if (mapped) {
            toast.error(mapped)
            return
          }
        }

        toast.error(t`Something went wrong. Try again.`)
      }
    },
  })

  const suggestion = suggestionQuery.data
  const currency = suggestion?.currency ?? 'USD'
  const amount = useStore(form.store, (state) => state.values.amount)
  const amountLabel = useMemo(
    () => formatOfferAmount(amount || '0', currency),
    [amount, currency],
  )

  useEffect(() => {
    const wasOpen = previousOpenRef.current
    previousOpenRef.current = open

    if (!open) {
      if (
        wasOpen &&
        !closingAfterSuccessRef.current &&
        !cancellationTrackedRef.current
      ) {
        analytics.trackCancelled(step)
      }
      openedTrackedRef.current = false
      amountOverriddenRef.current = false
      closingAfterSuccessRef.current = false
      cancellationTrackedRef.current = false
      suggestionAppliedRef.current = null
      setStep('amount')
      form.reset()
      return
    }

    if (!openedTrackedRef.current) {
      openedTrackedRef.current = true
      analytics.trackOpened()
    }
  }, [analytics, open, step])

  useEffect(() => {
    if (!suggestion || !deliverableId) return
    if (suggestionAppliedRef.current === deliverableId) return

    suggestionAppliedRef.current = deliverableId
    form.setFieldValue('amount', suggestion.suggested_amount)
  }, [deliverableId, form, suggestion])

  function closeWithCancellation() {
    if (!closingAfterSuccessRef.current && !cancellationTrackedRef.current) {
      cancellationTrackedRef.current = true
      analytics.trackCancelled(step)
    }
    onOpenChange(false)
  }

  function handleAmountChange() {
    if (!amountOverriddenRef.current) {
      amountOverriddenRef.current = true
      analytics.trackAmountOverridden()
    }
  }

  const bonusNote = suggestion
    ? getSpeedBonusNote(suggestion.speed_bonus_reason)
    : null

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeWithCancellation()
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex h-full w-full flex-col gap-0 sm:max-w-lg"
        >
          <SheetTitle className="sr-only">{t`Mark as paid`}</SheetTitle>
          <SheetDescription className="sr-only">
            {t`Confirm payment to ${creatorName}`}
          </SheetDescription>

          <header className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {t`Mark as paid`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t`To ${creatorName}`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t`Close`}
              onClick={closeWithCancellation}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          {suggestionQuery.isLoading ? (
            <div
              className="flex flex-1 flex-col gap-5 p-5"
              role="status"
              aria-label={t`Loading payment suggestion`}
            >
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          ) : suggestionQuery.isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <p className="text-center text-sm text-destructive">
                {getLoadErrorMessage(suggestionQuery.error)}
              </p>
              <Button variant="outline" onClick={closeWithCancellation}>
                {t`Close`}
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
              }}
            >
              <div className="flex flex-1 flex-col gap-5 p-5">
                <form.AppField name="amount">
                  {(field) => {
                    const showError =
                      (field.state.meta.isBlurred ||
                        field.state.meta.isDirty) &&
                      field.state.meta.errors.length > 0
                    const error = showError
                      ? firstErrorMessage(field.state.meta.errors)
                      : undefined

                    return (
                      <FieldRow
                        label={t`Amount`}
                        hint={t`Use up to 2 decimal places.`}
                        error={error}
                      >
                        {(aria) => (
                          <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                              $
                            </span>
                            <Input
                              {...aria}
                              aria-label={t`Amount paid`}
                              className="pl-7"
                              inputMode="decimal"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                const nextAmount = event.currentTarget.value
                                field.handleChange(nextAmount)
                                handleAmountChange()
                              }}
                            />
                          </div>
                        )}
                      </FieldRow>
                    )
                  }}
                </form.AppField>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">{bonusNote}</p>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    {t`Payment amount`}
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-primary">
                    {amountLabel}
                  </p>
                </div>
              </div>

              <footer className="flex justify-end gap-2 border-t border-border p-5">
                <Button variant="outline" onClick={closeWithCancellation}>
                  {t`Cancel`}
                </Button>
                <form.AppForm>
                  <form.SubmitButton label={t`Confirm`} />
                </form.AppForm>
              </footer>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <MarkAsPaidConfirmDialog
        open={open && step === 'final_confirmation'}
        amountLabel={amountLabel}
        creatorName={creatorName}
        isSubmitting={mutation.isPending}
        onCancel={() => setStep('amount')}
        onConfirm={() => void form.handleSubmit()}
      />
    </>
  )
}
