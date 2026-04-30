import { useMutation, useQueryClient } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'
import { getConversationDetailQueryKey } from '#/features/chat/queries'
import { CONVERSATIONS_QUERY_KEY } from '#/features/chat/workspace/useConversationsQuery'

interface MarkReadResponse {
  data: {
    marked_count: number
  }
  status: number
}

export function useMarkConversationReadMutation(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return customFetch<MarkReadResponse>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
        { method: 'POST' },
      )
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getConversationDetailQueryKey(conversationId),
      })
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      })
    },
  })
}
