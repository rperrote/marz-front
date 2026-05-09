import { t } from '@lingui/core/macro'
import { Loader2, Mail, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
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
import type { CreateCampaignInviteRequest } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { applyBackendFieldErrors, useAppForm } from '#/shared/ui/form'

import { useCreateCampaignInvite } from './mutations'

interface AddCreatorDialogProps {
  campaignId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  allowsInPlatformInvites: boolean
}

const addCreatorSchema = z.object({
  mode: z.enum(['email', 'in_platform']),
  email: z.email(t`Ingresá un email válido`).or(z.literal('')),
  // RAFITA:BLOCKER: Current OpenAPI accepts creator_account_id, not creator_handle.
  // When backend exposes creator_handle in CreateCampaignInviteRequest, update this field and payload.
  creator_account_id: z.uuid(t`Ingresá un creator válido`).or(z.literal('')),
})

type AddCreatorFormValues = z.infer<typeof addCreatorSchema>

const defaultValues: AddCreatorFormValues = {
  mode: 'email',
  email: '',
  creator_account_id: '',
}

export function AddCreatorDialog({
  campaignId,
  open,
  onOpenChange,
  allowsInPlatformInvites,
}: AddCreatorDialogProps) {
  const [inPlatformDisabledByPlan, setInPlatformDisabledByPlan] =
    useState(false)
  const createInvite = useCreateCampaignInvite(campaignId)
  const showInPlatform = canShowInPlatformInvites(
    allowsInPlatformInvites,
    inPlatformDisabledByPlan,
  )

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: addCreatorSchema,
    },
    onSubmit: async ({ value }) => {
      const validationError = getAddCreatorValidationError(value)
      if (validationError) {
        toast.error(validationError)
        return
      }

      try {
        await createInvite.mutateAsync(toInvitePayload(value))
        onOpenChange(false)
        form.reset()
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 409 &&
          error.code === 'plan_does_not_allow_in_platform_invite'
        ) {
          setInPlatformDisabledByPlan(true)
          form.setFieldValue('mode', 'email')
          return
        }

        applyBackendFieldErrors(form, error, {
          fallback: (message) => toast.error(message),
        })
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Add manually`}</DialogTitle>
          <DialogDescription>
            {t`Creá una invitación para esta campaña.`}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.AppField name="mode">
            {(field) => (
              <div
                className={
                  showInPlatform
                    ? 'grid grid-cols-2 gap-2 rounded-xl bg-muted p-1'
                    : 'grid grid-cols-1 gap-2 rounded-xl bg-muted p-1'
                }
              >
                <ModeButton
                  active={field.state.value === 'email'}
                  icon={<Mail className="size-4" aria-hidden />}
                  label={t`Email`}
                  onClick={() => field.handleChange('email')}
                />
                {showInPlatform ? (
                  <ModeButton
                    active={field.state.value === 'in_platform'}
                    icon={<Send className="size-4" aria-hidden />}
                    label={t`In-platform`}
                    onClick={() => field.handleChange('in_platform')}
                  />
                ) : null}
              </div>
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.mode}>
            {(mode) =>
              mode === 'email' || !showInPlatform ? (
                <form.AppField name="email">
                  {(field) => (
                    <field.TextField
                      label={t`Email`}
                      type="email"
                      placeholder={t`creator@ejemplo.com`}
                    />
                  )}
                </form.AppField>
              ) : null
            }
          </form.Subscribe>

          {!allowsInPlatformInvites ? (
            <p className="rounded-xl border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
              {t`Tu plan actual permite invitaciones por email.`}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t`Cancelar`}
            </Button>
            <form.AppForm>
              <form.SubmitButton
                label={t`Send invite`}
                loadingLabel={
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t`Enviando`}
                  </>
                }
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className="rounded-lg"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  )
}

function canShowInPlatformInvites(
  allowsInPlatformInvites: boolean,
  inPlatformDisabledByPlan: boolean,
) {
  return allowsInPlatformInvites && !inPlatformDisabledByPlan
}

function getAddCreatorValidationError(value: AddCreatorFormValues) {
  if (value.mode === 'email' && value.email.trim().length === 0) {
    return t`Ingresá un email.`
  }
  if (
    value.mode === 'in_platform' &&
    value.creator_account_id.trim().length === 0
  ) {
    return t`Ingresá un creator.`
  }
  return undefined
}

function toInvitePayload(
  value: AddCreatorFormValues,
): CreateCampaignInviteRequest {
  if (value.mode === 'email') {
    return {
      mode: 'email',
      email: value.email.trim(),
    }
  }

  return {
    mode: 'in_platform',
    creator_account_id: value.creator_account_id.trim(),
  }
}
