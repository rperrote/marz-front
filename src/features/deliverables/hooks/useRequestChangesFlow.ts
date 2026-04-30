import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { ApiError } from '#/shared/api/mutator'
import { useRequestChangesMutation } from '#/features/deliverables/api/requestChanges'
import type { ChangeCategory } from '#/features/deliverables/api/requestChanges'
import { trackChangeRequestSubmitted } from '#/features/deliverables/analytics'
import type { OfferType } from '#/features/deliverables/types'

const NOTES_MAX_LENGTH = 4000

export type RequestChangesFlowError =
  | { kind: 'field'; field: string; message: string }
  | { kind: 'fatal'; message: string }

type SubmitStatus = 'idle' | 'submitting' | 'success'

export interface RequestChangesFlowState {
  categories: Set<ChangeCategory>
  notes: string
  canSubmit: boolean
  submitStatus: SubmitStatus
  error: RequestChangesFlowError | null
}

export interface RequestChangesFlowActions {
  toggleCategory: (category: ChangeCategory) => void
  setNotes: (notes: string) => void
  submit: () => void
  reset: () => void
}

export function useRequestChangesFlow(
  deliverableId: string,
  draftId: string,
  options?: {
    onSuccess?: () => void
    onConflict?: () => void
    analytics?: {
      offerType: OfferType
      deliverableIndex: number
      draftVersion: number
      roundIndex: number
    }
  },
): RequestChangesFlowState & RequestChangesFlowActions {
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const [categories, setCategories] = useState<Set<ChangeCategory>>(new Set())
  const [notes, setNotesState] = useState('')
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [error, setError] = useState<RequestChangesFlowError | null>(null)

  const mutation = useRequestChangesMutation(deliverableId, draftId)

  const canSubmit = useMemo(() => {
    if (categories.size === 0) return false
    if (categories.has('other') && notes.trim().length === 0) return false
    if (notes.length > NOTES_MAX_LENGTH) return false
    return true
  }, [categories, notes])

  const toggleCategory = useCallback((category: ChangeCategory) => {
    setCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
    setError(null)
  }, [])

  const setNotes = useCallback((value: string) => {
    setNotesState(value)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    idempotencyKeyRef.current = crypto.randomUUID()
    setCategories(new Set())
    setNotesState('')
    setSubmitStatus('idle')
    setError(null)
  }, [])

  const submit = useCallback(() => {
    if (!canSubmit) return

    const sortedCategories = Array.from(categories).sort()

    setSubmitStatus('submitting')
    setError(null)

    mutation.mutate(
      {
        body: {
          categories: sortedCategories,
          notes: notes.trim(),
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: () => {
          if (options?.analytics) {
            trackChangeRequestSubmitted({
              actor_kind: 'brand',
              offer_type: options.analytics.offerType,
              deliverable_index: options.analytics.deliverableIndex,
              draft_version: options.analytics.draftVersion,
              categories: sortedCategories,
              categories_count: sortedCategories.length,
              has_notes: notes.trim().length > 0,
              round_index: options.analytics.roundIndex,
            })
          }
          setSubmitStatus('success')
          options?.onSuccess?.()
        },
        onError: (err) => {
          setSubmitStatus('idle')

          if (err instanceof ApiError) {
            if (
              err.status === 409 &&
              err.code === 'change_request_already_exists'
            ) {
              toast.error(t`Ya se solicitó un cambio para este borrador.`)
              options?.onConflict?.()
              return
            }

            if (err.status === 422 && err.code === 'validation_error') {
              const fieldKeys = err.details?.field_errors
                ? Object.keys(err.details.field_errors)
                : []
              const field = fieldKeys[0] ?? 'notes'
              const message =
                err.details?.field_errors?.[field]?.[0] ?? err.message
              setError({ kind: 'field', field, message })
              return
            }

            if (err.status === 403 && err.code === 'forbidden_role') {
              setError({
                kind: 'fatal',
                message:
                  err.message || t`No tenés permiso para realizar esta acción.`,
              })
              return
            }
          }

          setError({
            kind: 'fatal',
            message:
              err instanceof Error
                ? err.message
                : t`Algo salió mal. Intentá de nuevo.`,
          })
        },
      },
    )
  }, [canSubmit, categories, notes, mutation, options])

  return useMemo(
    () => ({
      categories,
      notes,
      canSubmit,
      submitStatus,
      error,
      toggleCategory,
      setNotes,
      submit,
      reset,
    }),
    [
      categories,
      notes,
      canSubmit,
      submitStatus,
      error,
      toggleCategory,
      setNotes,
      submit,
      reset,
    ],
  )
}
