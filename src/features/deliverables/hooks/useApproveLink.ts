import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { ApiError, customFetch } from '#/shared/api/mutator'

type ApiResponse<T> = { data: T; status: number }

interface ApproveLinkMutationVariables {
  deliverableId: string
  linkId: string
  idempotencyKey: string
}

interface OptimisticContext {
  previousDeliverable: unknown
}

// RAFITA:BLOCKER: src/shared/api/generated does not expose approve-link yet.
// Replace this manual mutation with the Orval hook once api:sync includes it.
export function useApproveLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<void>,
    Error,
    ApproveLinkMutationVariables,
    OptimisticContext
  >({
    mutationFn: ({ deliverableId, linkId, idempotencyKey }) =>
      customFetch<ApiResponse<void>>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/links/${encodeURIComponent(linkId)}/approve`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      ),
    onMutate: async ({ deliverableId }) => {
      const queryKey = ['deliverable', deliverableId] as const
      await queryClient.cancelQueries({ queryKey })
      const previousDeliverable = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (old === null || typeof old !== 'object') return old
        return { ...old, status: 'completed' }
      })

      return { previousDeliverable }
    },
    onError: (_error, { deliverableId }, context) => {
      queryClient.setQueryData(
        ['deliverable', deliverableId],
        context?.previousDeliverable,
      )
    },
    onSettled: async (_data, _error, { deliverableId }) => {
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

export function useApproveLink(deliverableId: string, linkId: string) {
  const mutation = useApproveLinkMutation()

  const mutate = useCallback(
    (options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }) => {
      mutation.mutate(
        {
          deliverableId,
          linkId,
          idempotencyKey: crypto.randomUUID(),
        },
        {
          onSuccess: () => {
            options?.onSuccess?.()
          },
          onError: (error) => {
            toast.error(getApproveLinkErrorMessage(error))
            options?.onError?.(error)
          },
        },
      )
    },
    [deliverableId, linkId, mutation],
  )

  return {
    ...mutation,
    mutate,
  }
}

export function getApproveLinkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 && error.code === 'INVALID_LINK_STATUS') {
      return t`Link is no longer pending review.`
    }

    if (error.status === 403) {
      return t`Only brand owner can approve links.`
    }
  }

  return t`Something went wrong. Try again.`
}
