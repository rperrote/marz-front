import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useMarkRead } from '#/shared/api/generated/chat/chat'
import { getConversationDetailQueryKey } from '#/features/chat/queries'

export function useMarkConversationReadMutation(conversationId: string) {
  const queryClient = useQueryClient()
  const mutation = useMarkRead({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getConversationDetailQueryKey(conversationId),
        })
        void queryClient.invalidateQueries({
          queryKey: ['conversations'],
        })
      },
    },
  })

  const { mutate } = mutation
  const stableMutate = useCallback(() => {
    mutate({ conversationId })
  }, [mutate, conversationId])

  return {
    ...mutation,
    mutate: stableMutate,
  }
}
