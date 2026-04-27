import { useCallback, useId, useState } from 'react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { IconButton } from '#/shared/ui/IconButton'
import { X, Play } from 'lucide-react'
import { cn } from '#/lib/utils'
import { InlineVideoPlayer } from './InlineVideoPlayer'
import { ChangeCategoryChip } from './ChangeCategoryChip'
import { useRequestChangesFlow } from '#/features/deliverables/hooks/useRequestChangesFlow'
import type { ChangeCategory } from '#/features/deliverables/api/requestChanges'

const CHANGE_CATEGORIES: { value: ChangeCategory; label: () => string }[] = [
  { value: 'product_placement', label: () => t`Product placement` },
  { value: 'pacing', label: () => t`Pacing` },
  { value: 'audio', label: () => t`Audio` },
  { value: 'discount_code', label: () => t`Discount code` },
  { value: 'other', label: () => t`Other` },
]

const NOTES_MAX_LENGTH = 4000

interface RequestChangesModalProps {
  title: string
  triggerLabel?: string
  /** Required for real usage; optional for design-system showcase. */
  deliverableId?: string
  draftId?: string
  playbackUrl?: string
  thumbnailUrl?: string
  durationSec?: number
  aspect?: 'landscape' | 'portrait'
  inline?: boolean
  onClose?: () => void
  onSubmitted?: () => void
}

export function RequestChangesModal({
  title,
  triggerLabel = t`Request changes`,
  deliverableId,
  draftId,
  playbackUrl,
  thumbnailUrl,
  durationSec,
  aspect = 'landscape',
  inline = false,
  onClose,
  onSubmitted,
}: RequestChangesModalProps) {
  const isReal = deliverableId != null && draftId != null

  const flow = useRequestChangesFlow(deliverableId ?? '', draftId ?? '', {
    onSuccess: () => {
      onSubmitted?.()
      onClose?.()
    },
    onConflict: () => {
      onClose?.()
    },
  })

  const [localCategories, setLocalCategories] = useState<Set<ChangeCategory>>(
    new Set(),
  )
  const [localNotes, setLocalNotes] = useState('')
  const [open, setOpen] = useState(false)

  const categories = isReal ? flow.categories : localCategories
  const notes = isReal ? flow.notes : localNotes
  const canSubmit = isReal
    ? flow.canSubmit
    : localCategories.size > 0 &&
      (!localCategories.has('other') || localNotes.trim().length > 0) &&
      localNotes.length <= NOTES_MAX_LENGTH
  const isSubmitting = isReal ? flow.submitStatus === 'submitting' : false
  const error = isReal ? flow.error : null

  const handleToggle = useCallback(
    (category: ChangeCategory) => {
      if (isReal) {
        flow.toggleCategory(category)
      } else {
        setLocalCategories((prev) => {
          const next = new Set(prev)
          if (next.has(category)) next.delete(category)
          else next.add(category)
          return next
        })
      }
    },
    [isReal, flow],
  )

  const handleNotesChange = useCallback(
    (value: string) => {
      if (isReal) {
        flow.setNotes(value)
      } else {
        setLocalNotes(value)
      }
    },
    [isReal, flow],
  )

  const handleSubmit = useCallback(() => {
    if (isReal) {
      flow.submit()
    }
  }, [isReal, flow])

  const handleCancel = useCallback(() => {
    setOpen(false)
    if (isReal) {
      flow.reset()
    } else {
      setLocalCategories(new Set())
      setLocalNotes('')
    }
    onClose?.()
  }, [isReal, flow, onClose])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleCancel()
      } else {
        setOpen(true)
        if (isReal) {
          flow.reset()
        } else {
          setLocalCategories(new Set())
          setLocalNotes('')
        }
      }
    },
    [handleCancel, isReal, flow],
  )

  const baseId = useId()
  const notesId = `${baseId}-notes`
  const notesErrorId = `${baseId}-notes-error`
  const notesHintId = `${baseId}-notes-hint`
  const notesDescribedBy =
    error?.kind === 'field' && error.field === 'notes'
      ? notesErrorId
      : notesHintId

  const body = (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            {t`Request changes`}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {!inline ? (
          <IconButton
            aria-label={t`Close`}
            shape="circle"
            onClick={handleCancel}
          >
            <X />
          </IconButton>
        ) : null}
      </header>

      {playbackUrl ? (
        <InlineVideoPlayer
          playbackUrl={playbackUrl}
          thumbnailUrl={thumbnailUrl}
          durationSec={durationSec}
          aspect={aspect}
          deliverableId={deliverableId}
          draftId={draftId}
        />
      ) : (
        <div className="aspect-video w-full rounded-lg bg-muted">
          <div className="flex h-full items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-foreground/70 text-background">
              <Play className="size-7" />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">
          {t`What needs to change?`}
        </Label>
        <div className="flex flex-wrap gap-2">
          {CHANGE_CATEGORIES.map((cat) => (
            <ChangeCategoryChip
              key={cat.value}
              label={cat.label()}
              selected={categories.has(cat.value)}
              onToggle={() => handleToggle(cat.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={notesId}
            className="text-sm font-semibold text-foreground"
          >
            {t`Additional notes`}
          </Label>
          <span
            id={notesHintId}
            className={cn(
              'text-xs tabular-nums',
              notes.length > NOTES_MAX_LENGTH
                ? 'text-destructive'
                : 'text-muted-foreground',
            )}
          >
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={t`Be specific — mention timestamps if possible (e.g. 'at 0:42 the product logo is cropped')`}
          rows={4}
          aria-describedby={notesDescribedBy}
          aria-invalid={
            error?.kind === 'field' && error.field === 'notes'
              ? 'true'
              : undefined
          }
        />
        {error?.kind === 'field' && error.field === 'notes' ? (
          <p
            id={notesErrorId}
            className="text-sm text-destructive"
            role="alert"
          >
            {error.message}
          </p>
        ) : null}
      </div>

      {error?.kind === 'fatal' ? (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error.message}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {t`Cancel`}
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? t`Sending…` : t`Send request`}
        </Button>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6">
        <h2 className="sr-only">{title}</h2>
        {body}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t`Request changes for this draft`}
        </DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  )
}
