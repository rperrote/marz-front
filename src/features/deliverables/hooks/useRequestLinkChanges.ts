import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { ApiError } from '#/shared/api/mutator'
import { requestLinkChanges } from '#/shared/api/generated/deliverables/deliverables'
import {
  generateIdempotencyKey,
  withIdempotencyKey,
} from '#/shared/api/idempotency'
import type { ChangeCategory, RequestChangesBody } from '../api/requestChanges'
import type {
  RequestChangesFlowActions,
  RequestChangesFlowError,
  RequestChangesFlowState,
} from './useRequestChangesFlow'
import { getDeliverableLinksQueryKey } from './useDeliverableLinks'

const NOTES_MAX_LENGTH = 4000

interface RequestLinkChangesMutationVariables {
  deliverableId: string
  linkId: string
  body: RequestChangesBody
  idempotencyKey: string
}

export function useRequestLinkChangesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: RequestLinkChangesMutationVariables) =>
      requestLinkChanges(
        variables.linkId,
        {
          deliverable_id: variables.deliverableId,
          categories: variables.body.categories,
          notes: variables.body.notes,
        },
        withIdempotencyKey(variables.idempotencyKey),
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['deliverable', variables.deliverableId],
      })
      void queryClient.invalidateQueries({
        queryKey: getDeliverableLinksQueryKey(variables.deliverableId),
      })
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
  const idempotencyKeyRef = useRef(generateIdempotencyKey())
  const [categories, setCategories] = useState<Set<ChangeCategory>>(new Set())
  const [notes, setNotesState] = useState('')
  const [submitStatus, setSubmitStatus] =
    useState<RequestChangesFlowState['submitStatus']>('idle')
  const [error, setError] = useState<RequestChangesFlowError | null>(null)

  const { mutateAsync } = useRequestLinkChangesMutation()

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
    idempotencyKeyRef.current = generateIdempotencyKey()
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

    mutateAsync({
      deliverableId,
      linkId,
      body: {
        categories: sortedCategories,
        notes: notes.trim(),
      },
      idempotencyKey: idempotencyKeyRef.current,
    })
      .then(() => {
        setSubmitStatus('success')
        options?.onSuccess?.()
      })
      .catch((err: unknown) => {
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
      })
  }, [
    canSubmit,
    categories,
    deliverableId,
    linkId,
    mutateAsync,
    notes,
    options,
  ])

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
