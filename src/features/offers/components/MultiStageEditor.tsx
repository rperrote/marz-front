import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  useAppForm,
  applyBackendFieldErrors,
  firstErrorMessage,
} from '#/shared/ui/form'
import { ApiError } from '#/shared/api/mutator'

import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'
import { useActiveCampaigns } from '../hooks/useActiveCampaigns'
import { useCreateMultistageOffer } from '../hooks/useCreateMultistageOffer'
import { DeliverableSummaryRow } from './DeliverableSummaryRow'
import { StageEditor } from './StageEditor'
import {
  multiStageEditorBaseSchema,
  multiStageEditorSubmitSchema,
} from '../schemas/multiStageEditor'

export const defaultValues = {
  campaign_id: '',
  stages: [
    {
      id: crypto.randomUUID() as string,
      name: '',
      description: '',
      deadline: '',
      amount: '',
    },
  ],
}

export type MultiStageEditorFormValues = typeof defaultValues

interface MultiStageEditorProps {
  onClose: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function MultiStageEditor({
  onClose,
  onDirtyChange,
}: MultiStageEditorProps) {
  const { conversationId } = useSendOfferSheetStore()
  const campaignsQuery = useActiveCampaigns()
  const mutation = useCreateMultistageOffer()
  const [backendBanner, setBackendBanner] = useState<string | null>(null)

  const campaigns = campaignsQuery.data ?? []

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: multiStageEditorBaseSchema,
      onSubmit: multiStageEditorSubmitSchema,
    },
    onSubmit: async ({ value }) => {
      if (!conversationId) return
      setBackendBanner(null)

      const payload = {
        type: 'multistage' as const,
        campaign_id: value.campaign_id,
        conversation_id: conversationId,
        stages: value.stages.map((s) => ({
          name: s.name,
          description: s.description,
          deadline: s.deadline,
          amount: s.amount,
        })),
      }

      try {
        await mutation.mutateAsync(payload)
        onClose()
        toast.success(t`Offer sent`)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'campaign_not_active') {
          setBackendBanner(t`This campaign is no longer active`)
          return
        }
        applyBackendFieldErrors(form, error, {
          fallback: (msg) => toast.error(msg),
        })
      }
    },
  })

  const isDirty = useStore(form.store, (s) => s.isDirty)

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const selectedCampaignId = useStore(form.store, (s) => s.values.campaign_id)
  const stages = useStore(form.store, (s) => s.values.stages)

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  )

  const currency = selectedCampaign?.budget_currency ?? 'USD'
  const budgetRemaining = selectedCampaign
    ? parseFloat(selectedCampaign.budget_remaining)
    : Infinity

  const totalAmount = useMemo(() => {
    return stages.reduce((sum, s) => {
      const val = parseFloat(s.amount)
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }, [stages])

  const exceedsBudget =
    isFinite(budgetRemaining) && totalAmount > budgetRemaining

  const campaignOptions = campaigns.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const deadlineErrorsByIndex = useStore(form.store, (s) => {
    const map = new Map<number, string | undefined>()
    const errorMaps = s.errors as Array<
      Record<string, Array<{ message?: string; path?: Array<string | number> }>>
    >
    errorMaps.forEach((errorMap) => {
      Object.entries(errorMap).forEach(([key, issues]) => {
        const match = key.match(/^stages\[(\d+)\]\.deadline$/)
        if (match) {
          const index = parseInt(match[1]!, 10)
          const msg = firstErrorMessage(issues as ReadonlyArray<unknown>)
          if (msg) map.set(index, msg)
        }
      })
    })
    return map
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {backendBanner ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {backendBanner}
          </div>
        ) : null}

        <form.AppField name="campaign_id">
          {(field) => (
            <field.SelectField
              label={t`Campaign`}
              placeholder={t`Select a campaign`}
              options={campaignOptions}
            />
          )}
        </form.AppField>

        {selectedCampaign ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span>{t`Currency`}:</span>
            <span className="font-semibold text-foreground">{currency}</span>
          </div>
        ) : null}

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <StageRow
              key={stage.id}
              index={index}
              stage={stage}
              deadlineError={deadlineErrorsByIndex.get(index)}
              onRemove={
                stages.length > 1
                  ? () => {
                      form.setFieldValue(
                        'stages',
                        stages.filter((_, i) => i !== index),
                      )
                    }
                  : undefined
              }
              onChangeName={(v) =>
                form.setFieldValue(`stages[${index}].name`, v)
              }
              onChangeDescription={(v) =>
                form.setFieldValue(`stages[${index}].description`, v)
              }
              onChangeDeadline={(v) =>
                form.setFieldValue(`stages[${index}].deadline`, v)
              }
              onChangeAmount={(v) =>
                form.setFieldValue(`stages[${index}].amount`, v)
              }
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              form.setFieldValue('stages', [
                ...stages,
                {
                  id: crypto.randomUUID() as string,
                  name: '',
                  description: '',
                  deadline: '',
                  amount: '',
                },
              ])
            }
          >
            <Plus className="mr-2 size-4" />
            {t`Add stage`}
          </Button>

          <form.AppField name="stages" mode="array">
            {(field) =>
              field.state.meta.errors.length > 0 ? (
                <p aria-live="polite" className="text-sm text-destructive">
                  {firstErrorMessage(field.state.meta.errors)}
                </p>
              ) : null
            }
          </form.AppField>
        </div>

        {exceedsBudget ? (
          <p className="text-sm text-warning" aria-live="polite">
            {t`This amount exceeds the campaign's remaining budget (${currency} ${selectedCampaign?.budget_remaining ?? '0.00'})`}
          </p>
        ) : null}

        <DeliverableSummaryRow
          label={t`Total`}
          amount={totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}
          currency={currency}
          emphasis="strong"
        />
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onClose}>
          {t`Cancel`}
        </Button>
        <form.AppForm>
          <form.SubmitButton
            label={t`Send Offer`}
            loadingLabel={t`Sending...`}
          />
        </form.AppForm>
      </footer>
    </form>
  )
}

function StageRow({
  index,
  stage,
  deadlineError,
  onRemove,
  onChangeName,
  onChangeDescription,
  onChangeDeadline,
  onChangeAmount,
}: {
  index: number
  stage: {
    id: string
    name: string
    description: string
    deadline: string
    amount: string
  }
  deadlineError?: string
  onRemove?: () => void
  onChangeName: (value: string) => void
  onChangeDescription: (value: string) => void
  onChangeDeadline: (value: string) => void
  onChangeAmount: (value: string) => void
}) {
  return (
    <StageEditor
      stageNumber={index + 1}
      name={stage.name}
      description={stage.description}
      deadline={stage.deadline}
      amount={stage.amount}
      onChangeName={onChangeName}
      onChangeDescription={onChangeDescription}
      onChangeDeadline={onChangeDeadline}
      onChangeAmount={onChangeAmount}
      onRemove={onRemove}
      deadlineError={deadlineError}
    />
  )
}
