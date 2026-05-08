import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { ApiError, customFetch } from '#/shared/api/mutator'
import type { ChangeCategory, RequestChangesBody } from '../api/requestChanges'
import type {
  RequestChangesFlowActions,
  RequestChangesFlowError,
  RequestChangesFlowState,
} from './useRequestChangesFlow'

const NOTES_MAX_LENGTH = 4000

interface RequestLinkChangesMutationVariables {
  deliverableId: string
  linkId: string
  body: RequestChangesBody
  idempotencyKey: string
}

interface RequestLinkChangesResponse {
  data: {
    change_request_id: string
    status: string
  }
  status: number
}

// RAFITA:BLOCKER: src/shared/api/generated does not expose request-link-changes yet.
// Replace this manual mutation with the Orval hook once api:sync includes it.
export function useRequestLinkChangesMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    RequestLinkChangesResponse,
    Error,
    RequestLinkChangesMutationVariables
  >({
    mutationFn: ({ deliverableId, linkId, body, idempotencyKey }) =>
      customFetch<RequestLinkChangesResponse>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/links/${encodeURIComponent(linkId)}/request-changes`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        },
      ),
    onSuccess: async (_response, { deliverableId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['deliverable', deliverableId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['deliverable', deliverableId, 'links'],
        }),
      ])
    },
  })
}

export function useRequestLinkChanges(
  deliverableId: string,
  linkId: string,
  options?: {
    onSuccess?: () => void
    onConflict?: () => void
  },
): RequestChangesFlowState & RequestChangesFlowActions {
  const idempotencyKeyRef = useRef(crypto.randomUUID())
  const [categories, setCategories] = useState<Set<ChangeCategory>>(new Set())
  const [notes, setNotesState] = useState('')
  const [submitStatus, setSubmitStatus] =
    useState<RequestChangesFlowState['submitStatus']>('idle')
  const [error, setError] = useState<RequestChangesFlowError | null>(null)

  const mutation = useRequestLinkChangesMutation()

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
        deliverableId,
        linkId,
        body: {
          categories: sortedCategories,
          notes: notes.trim(),
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: () => {
          setSubmitStatus('success')
          options?.onSuccess?.()
        },
        onError: (err) => {
          setSubmitStatus('idle')

          if (err instanceof ApiError) {
            if (
              err.status === 409 &&
              err.code === 'CHANGE_REQUEST_ALREADY_EXISTS'
            ) {
              toast.error(t`Changes already requested on this link.`)
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

            if (err.status === 403) {
              setError({
                kind: 'fatal',
                message:
                  err.message || t`Only brand owner can request link changes.`,
              })
              return
            }
          }

          setError({
            kind: 'fatal',
            message:
              err instanceof Error
                ? err.message
                : t`Something went wrong. Try again.`,
          })
        },
      },
    )
  }, [canSubmit, categories, deliverableId, linkId, mutation, notes, options])

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
