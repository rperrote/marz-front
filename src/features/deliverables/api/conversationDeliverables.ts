import { useQuery } from '@tanstack/react-query'
import { getConversationDeliverables } from '#/shared/api/generated/deliverables/deliverables'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import type { ConversationDeliverablesResponse } from '#/features/deliverables/types'

async function fetchConversationDeliverables(
  conversationId: string,
): Promise<ConversationDeliverablesResponse> {
  const response = await getConversationDeliverables(conversationId)
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch conversation deliverables: ${response.status}`,
    )
  }
  return response.data as ConversationDeliverablesResponse
}

export function useGetConversationDeliverablesQuery(conversationId: string) {
  return useQuery<ConversationDeliverablesResponse>({
    queryKey: getConversationDeliverablesQueryKey(conversationId),
    queryFn: () => fetchConversationDeliverables(conversationId),
    enabled: !!conversationId,
  })
}
