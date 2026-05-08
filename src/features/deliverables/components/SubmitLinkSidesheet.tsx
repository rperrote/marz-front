import { useEffect, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { Link as LinkIcon, LoaderCircle, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import { applyBackendFieldErrors, useAppForm } from '#/shared/ui/form'
import {
  getSubmitLinkErrorMessage,
  useSubmitLinkMutation,
} from '#/features/deliverables/hooks/useSubmitLink'
import {
  trackLinkPreviewResolved,
  trackLinkSubmitOpened,
} from '#/features/deliverables/analytics'
import type { DeliverableDTO } from '#/features/deliverables/types'

const submitLinkSchema = z.object({
  url: z
    .string()
    .url()
    .regex(/^https?:\/\//),
})

interface SubmitLinkSidesheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliverableId: string
  platform: DeliverableDTO['platform']
  isResubmission?: boolean
  onSubmitted?: () => void
}

export function SubmitLinkSidesheet({
  open,
  onOpenChange,
  deliverableId,
  platform,
  isResubmission,
  onSubmitted,
}: SubmitLinkSidesheetProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(createUlid)
  const mutation = useSubmitLinkMutation()
  const { reset } = mutation

  const form = useAppForm({
    defaultValues: { url: '' },
    validators: { onChange: submitLinkSchema, onSubmit: submitLinkSchema },
    onSubmit: async ({ value, formApi }) => {
      setErrorMessage(null)

      try {
        const response = await mutation.mutateAsync({
          deliverableId,
          body: { url: value.url.trim() },
          idempotencyKey,
        })
        const preview = response.data.link.preview
        if (preview?.outcome) {
          trackLinkPreviewResolved({
            deliverable_id: deliverableId,
            link_id: response.data.link.id,
            platform,
            outcome: preview.outcome,
            ...(isResubmission === undefined
              ? {}
              : { is_resubmission: isResubmission }),
          })
        }
        onSubmitted?.()
        handleOpenChange(false)
      } catch (error) {
        applyBackendFieldErrors(formApi, error, {
          fallback: () => setErrorMessage(getSubmitLinkErrorMessage(error)),
        })
        setIdempotencyKey(createUlid())
      }
    },
  })

  const isValidUrl = useStore(form.store, (state) => state.canSubmit)
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const urlValue = useStore(form.store, (state) => state.values.url)

  useEffect(() => {
    setErrorMessage(null)
  }, [urlValue])

  useEffect(() => {
    if (!open) return
    trackLinkSubmitOpened({
      deliverable_id: deliverableId,
      platform,
      ...(isResubmission === undefined
        ? {}
        : { is_resubmission: isResubmission }),
    })
    form.reset()
    setErrorMessage(null)
    setIdempotencyKey(createUlid())
    reset()
  }, [deliverableId, form, isResubmission, open, platform, reset])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset()
      setErrorMessage(null)
      reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex h-full w-full gap-0 p-0 sm:max-w-lg"
      >
        <SheetTitle className="sr-only">{t`Submit Link`}</SheetTitle>
        <SheetDescription className="sr-only">
          {t`Submit a published deliverable link for brand approval.`}
        </SheetDescription>

        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-foreground">
              {t`Submit Link`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t`Paste the final published URL for this deliverable.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-surface-active hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t`Close`}
          >
            <X className="size-4" />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <form.AppField name="url">
              {(field) => (
                <field.TextField
                  type="url"
                  label={t`Published URL`}
                  hint={t`Use a YouTube, Instagram or TikTok URL.`}
                  placeholder={t`https://www.youtube.com/watch?v=abc123`}
                  autoComplete="url"
                />
              )}
            </form.AppField>

            <PreviewPlaceholder isActive={isValidUrl} />

            <p
              id="submit-link-error"
              aria-live="polite"
              className={cn(
                'min-h-5 text-sm text-destructive',
                !errorMessage && 'sr-only',
              )}
            >
              {errorMessage ?? t`No link submission error.`}
            </p>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border p-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t`Cancel`}
            </Button>
            <form.AppForm>
              <form.SubmitButton
                label={t`Send link`}
                loadingLabel={
                  <>
                    <LoaderCircle className="animate-spin" />
                    {t`Resolving preview...`}
                  </>
                }
                requireDirty
              />
            </form.AppForm>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function PreviewPlaceholder({ isActive }: { isActive: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <LinkIcon
            className={cn(
              'size-5',
              isActive ? 'text-success' : 'text-muted-foreground',
            )}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-28 rounded-full bg-muted" />
          <div className="h-3 w-full max-w-64 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}

function createUlid(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let timestamp = Date.now()
  let time = ''
  for (let i = 0; i < 10; i += 1) {
    time = alphabet.charAt(timestamp % 32) + time
    timestamp = Math.floor(timestamp / 32)
  }

  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let random = ''
  for (let i = 0; i < 16; i += 1) {
    const byte = bytes[i]
    if (byte === undefined) break
    random += alphabet.charAt(byte % 32)
  }

  return `${time}${random}`
}
