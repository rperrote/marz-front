import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { useApproveDraftMutation } from '#/features/deliverables/api/draftUpload'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import { getMessagesQueryKey } from '#/shared/queries/messages'

export function useApproveDraft(deliverableId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const mutation = useApproveDraftMutation(deliverableId)

  const mutate = useCallback(
    (options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }) => {
      mutation.mutate(undefined, {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getConversationDeliverablesQueryKey(conversationId),
          })
          void queryClient.invalidateQueries({
            queryKey: getMessagesQueryKey(conversationId),
          })
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || t`Something went wrong. Try again.`)
          options?.onError?.(error)
        },
      })
    },
    [mutation, queryClient, conversationId],
  )

  return {
    ...mutation,
    mutate,
  }
}
