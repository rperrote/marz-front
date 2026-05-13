import { useCallback, useId, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'

import { useRequestChangesFlow } from '#/features/deliverables/hooks/useRequestChangesFlow'
import { useRequestLinkChanges } from '#/features/deliverables/hooks/useRequestLinkChanges'
import type { ChangeCategory } from '#/features/deliverables/api/requestChanges'
import { useRequestChangesModalAnalytics } from './RequestChangesModalAnalytics'
import { RequestChangesModalBody } from './RequestChangesModalBody'
import { RequestChangesModalFrame } from './RequestChangesModalFrame'
import type { RequestChangesModalProps } from './RequestChangesModalTypes'

const NOTES_MAX_LENGTH = 4000

export function RequestChangesModal({
  title,
  triggerLabel,
  target = 'draft',
  deliverableId,
  draftId,
  linkId,
  playbackUrl,
  thumbnailUrl,
  durationSec,
  aspect = 'landscape',
  inline = false,
  onClose,
  onSubmitted,
  trigger,
  analytics,
}: RequestChangesModalProps) {
  const isReal =
    deliverableId != null &&
    (target === 'draft' ? draftId != null : linkId != null)
  const submittedRef = useRef(false)
  const actionLabel =
    target === 'link'
      ? t`Solicitar cambios en el link`
      : t`Solicitar cambios en el draft`
  const resolvedTriggerLabel = triggerLabel ?? t`Solicitar cambios`
  const [localCategories, setLocalCategories] = useState<Set<ChangeCategory>>(
    new Set(),
  )
  const [localNotes, setLocalNotes] = useState('')
  const [open, setOpen] = useState(false)

  const completeSubmission = useCallback(() => {
    submittedRef.current = true
    setOpen(false)
    onSubmitted?.()
    onClose?.()
  }, [onClose, onSubmitted])

  const draftFlow = useRequestChangesFlow(deliverableId ?? '', draftId ?? '', {
    onSuccess: completeSubmission,
    onConflict: () => {
      onClose?.()
    },
    analytics,
  })
  const linkFlow = useRequestLinkChanges(deliverableId ?? '', linkId ?? '', {
    onSuccess: completeSubmission,
    onConflict: () => {
      onClose?.()
    },
  })
  const flow = target === 'draft' ? draftFlow : linkFlow

  const categories = isReal ? flow.categories : localCategories
  const notes = isReal ? flow.notes : localNotes
  const canSubmit = isReal
    ? flow.canSubmit
    : localCategories.size > 0 &&
      (!localCategories.has('other') || localNotes.trim().length > 0) &&
      localNotes.length <= NOTES_MAX_LENGTH
  const isSubmitting = isReal ? flow.submitStatus === 'submitting' : false
  const error = isReal ? flow.error : null
  const activeAnalytics = isReal && (inline || open) ? analytics : undefined

  useRequestChangesModalAnalytics(activeAnalytics, submittedRef)

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
        submittedRef.current = false
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
    <RequestChangesModalBody
      actionLabel={actionLabel}
      title={title}
      inline={inline}
      showMedia={target === 'draft'}
      playbackUrl={playbackUrl}
      thumbnailUrl={thumbnailUrl}
      durationSec={durationSec}
      aspect={aspect}
      deliverableId={deliverableId}
      draftId={draftId}
      categories={categories}
      notes={notes}
      notesId={notesId}
      notesHintId={notesHintId}
      notesErrorId={notesErrorId}
      notesDescribedBy={notesDescribedBy}
      error={error}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onToggleCategory={handleToggle}
      onNotesChange={handleNotesChange}
    />
  )

  if (inline) {
    return (
      <RequestChangesModalFrame inline title={title}>
        {body}
      </RequestChangesModalFrame>
    )
  }

  return (
    <RequestChangesModalFrame
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      triggerLabel={resolvedTriggerLabel}
      actionLabel={actionLabel}
      target={target}
    >
      {body}
    </RequestChangesModalFrame>
  )
}
