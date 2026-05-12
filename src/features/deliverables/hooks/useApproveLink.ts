import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { ApiError } from '#/shared/api/mutator'
import { useApproveLink as useApproveLinkOrval } from '#/shared/api/generated/deliverables/deliverables'
import { getDeliverableLinksQueryKey } from './useDeliverableLinks'

interface ApproveLinkMutationVariables {
  deliverableId: string
  linkId: string
  idempotencyKey: string
}

export function useApproveLinkMutation() {
  const queryClient = useQueryClient()
  const mutation = useApproveLinkOrval()

  const mutate = async (variables: ApproveLinkMutationVariables) => {
    const previous = queryClient.getQueryData([
      'deliverable',
      variables.deliverableId,
    ])
    queryClient.setQueryData(
      ['deliverable', variables.deliverableId],
      (old: unknown) => {
        if (old === null || typeof old !== 'object') return old
        return { ...old, status: 'completed' }
      },
    )

    try {
      const response = await mutation.mutateAsync({
        linkId: variables.linkId,
        data: { deliverable_id: variables.deliverableId },
      })
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['deliverable', variables.deliverableId],
        }),
        queryClient.invalidateQueries({
          queryKey: getDeliverableLinksQueryKey(variables.deliverableId),
        }),
      ])
      return response
    } catch (err) {
      queryClient.setQueryData(
        ['deliverable', variables.deliverableId],
        previous,
      )
      throw err
    }
  }

  return { ...mutation, mutateAsync: mutate, mutate }
}

export function useApproveLink(deliverableId: string, linkId: string) {
  const mutation = useApproveLinkMutation()

  const mutate = useCallback(
    (options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }) => {
      mutation
        .mutateAsync({
          deliverableId,
          linkId,
          idempotencyKey: crypto.randomUUID(),
        })
        .then(() => {
          options?.onSuccess?.()
        })
        .catch((error: Error) => {
          toast.error(getApproveLinkErrorMessage(error))
          options?.onError?.(error)
        })
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
