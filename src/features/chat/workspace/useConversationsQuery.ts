import { useInfiniteQuery } from '@tanstack/react-query'

import { listConversations } from '#/shared/api/generated/chat/chat'
import type {
  ConversationListResponse,
  ListConversationsParams,
} from '#/shared/api/generated/model'

const DEFAULT_LIMIT = 30
const GC_TIME = 5 * 60 * 1000

interface UseConversationsQueryParams {
  filter?: ListConversationsParams['filter']
  search?: ListConversationsParams['search']
  campaignId?: string
}

function getConversationsQueryKey(params: UseConversationsQueryParams) {
  return ['conversations', params] as const
}

function toApiParams(
  params: UseConversationsQueryParams,
  cursor?: string,
): ListConversationsParams {
  return {
    ...(params.filter && params.filter !== 'all'
      ? { filter: params.filter }
      : {}),
    ...(params.search ? { search: params.search } : {}),
    ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
    ...(cursor ? { cursor } : {}),
    limit: DEFAULT_LIMIT,
  }
}

// `customFetch` (mutator) throws on non-2xx, so the runtime success path is
// always the 200 branch — the union with Error is just Orval's defensive typing.
async function fetchPage(
  params: UseConversationsQueryParams,
  cursor: string | undefined,
  signal: AbortSignal,
): Promise<{ data: ConversationListResponse }> {
  const res = await listConversations(toApiParams(params, cursor), { signal })
  return res as { data: ConversationListResponse }
}

export function useConversationsQuery(params: UseConversationsQueryParams) {
  return useInfiniteQuery({
    queryKey: getConversationsQueryKey(params),
    queryFn: ({ pageParam, signal }) => fetchPage(params, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
    staleTime: 0,
    gcTime: GC_TIME,
  })
}
