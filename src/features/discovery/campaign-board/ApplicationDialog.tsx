import { useEffect, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { submitCreatorCampaignBoardApplicationBodyMessageMax } from '#/shared/api/generated/zod/creator/creator'
import { ApiError } from '#/shared/api/mutator'
import { applyBackendFieldErrors, useAppForm } from '#/shared/ui/form'

import { useSubmitCampaignApplicationMutation } from './hooks/useSubmitCampaignApplicationMutation'
import { generateIdempotencyKey } from './utils/idempotencyKey'

const applicationFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, t`Escribí un mensaje para postularte.`)
    .max(
      submitCreatorCampaignBoardApplicationBodyMessageMax,
      t`El mensaje no puede superar los ${submitCreatorCampaignBoardApplicationBodyMessageMax} caracteres.`,
    ),
})

interface ApplicationDialogProps {
  open: boolean
  campaignId: string | null
  campaignName?: string
  onOpenChange: (open: boolean) => void
  onViewApplication?: (campaignId: string) => void
  onSubmitted?: () => void
}

function isApiErrorCode(error: unknown, status: number, code: string) {
  return (
    error instanceof ApiError && error.status === status && error.code === code
  )
}

export function ApplicationDialog({
  open,
  campaignId,
  campaignName,
  onOpenChange,
  onViewApplication,
  onSubmitted,
}: ApplicationDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useSubmitCampaignApplicationMutation()
  const wasOpenRef = useRef(false)
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useAppForm({
    defaultValues: { message: '' },
    validators: {
      onChange: applicationFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!campaignId) return

      const message = value.message.trim()
      setFormError(null)

      try {
        await mutation.mutateAsync({
          campaignId,
          data: { message },
          idempotencyKey,
        })
        onSubmitted?.()
        toast.success(t`Postulación enviada`)
        onOpenChange(false)
      } catch (error) {
        if (isApiErrorCode(error, 409, 'idempotency_conflict')) {
          const retryKey = generateIdempotencyKey()
          setIdempotencyKey(retryKey)

          try {
            await mutation.mutateAsync({
              campaignId,
              data: { message },
              idempotencyKey: retryKey,
            })
            onSubmitted?.()
            toast.success(t`Postulación enviada`)
            onOpenChange(false)
          } catch (retryError) {
            if (isApiErrorCode(retryError, 409, 'idempotency_conflict')) {
              setFormError(
                t`No pudimos confirmar la postulación. Intentá enviarla de nuevo.`,
              )
              return
            }

            handleSubmitError(retryError, campaignId)
          }
          return
        }

        handleSubmitError(error, campaignId)
      }
    },
  })

  const message = useStore(form.store, (state) => state.values.message)
  const counterLabel = t`${message.length}/${submitCreatorCampaignBoardApplicationBodyMessageMax}`

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }

    if (wasOpenRef.current) return
    wasOpenRef.current = true
    setIdempotencyKey(generateIdempotencyKey())
    setFormError(null)
    form.reset()
  }, [form, open])

  function handleSubmitError(error: unknown, currentCampaignId: string) {
    if (isApiErrorCode(error, 409, 'application_already_exists')) {
      onOpenChange(false)
      toast.info(t`Ya enviaste una postulación para esta campaña.`, {
        action: onViewApplication
          ? {
              label: t`Ver postulación`,
              onClick: () => onViewApplication(currentCampaignId),
            }
          : undefined,
      })
      return
    }

    if (isApiErrorCode(error, 409, 'campaign_not_available')) {
      onOpenChange(false)
      void queryClient.invalidateQueries({
        queryKey: ['discovery', 'campaign-board'],
      })
      toast.info(t`Esta campaña ya no está disponible para postularte.`)
      return
    }

    if (error instanceof ApiError && error.status === 422) {
      applyBackendFieldErrors(form, error, {
        fallback: (msg) => setFormError(msg),
      })
      return
    }

    setFormError(t`No pudimos enviar la postulación. Intentá de nuevo.`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 rounded-2xl p-6 sm:max-w-xl">
        <DialogHeader className="gap-2">
          <DialogTitle>{t`Postularme`}</DialogTitle>
          <DialogDescription>
            {campaignName
              ? t`Contale a la marca por qué querés participar en ${campaignName}.`
              : t`Contale a la marca por qué querés participar en esta campaña.`}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="space-y-2">
            <form.AppField name="message">
              {(field) => (
                <field.TextareaField
                  label={t`Mensaje`}
                  placeholder={t`Hola, me interesa participar porque...`}
                  className="min-h-40 resize-none rounded-xl border-border bg-input/40 text-sm"
                  maxLength={
                    submitCreatorCampaignBoardApplicationBodyMessageMax + 1
                  }
                />
              )}
            </form.AppField>
            <p className="text-right text-xs text-muted-foreground">
              {counterLabel}
            </p>
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              {t`Cancelar`}
            </Button>
            <form.AppForm>
              <form.SubmitButton
                label={t`Enviar postulación`}
                loadingLabel={t`Enviando...`}
                className="rounded-xl"
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
