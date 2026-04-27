import { useQuery } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'
import type { ConversationDeliverablesResponse } from '#/features/deliverables/types'

type ApiResponse<T> = { data: T; status: number }

export function getConversationDeliverablesQueryKey(conversationId: string) {
  return ['conversation-deliverables', conversationId]
}

export async function fetchConversationDeliverables(
  conversationId: string,
): Promise<ConversationDeliverablesResponse> {
  const response = await customFetch<
    ApiResponse<ConversationDeliverablesResponse>
  >(`/v1/conversations/${encodeURIComponent(conversationId)}/deliverables`)
  return response.data
}

export function useGetConversationDeliverablesQuery(conversationId: string) {
  return useQuery<ConversationDeliverablesResponse>({
    queryKey: getConversationDeliverablesQueryKey(conversationId),
    queryFn: () => fetchConversationDeliverables(conversationId),
    enabled: !!conversationId,
  })
}
