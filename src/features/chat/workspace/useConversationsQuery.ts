import { useInfiniteQuery } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'

import type { ConversationListParams, ConversationListResponse } from './types'

export const CONVERSATIONS_QUERY_KEY = 'conversations'
const DEFAULT_LIMIT = 30
const GC_TIME = 5 * 60 * 1000

interface UseConversationsQueryParams {
  filter?: ConversationListParams['filter']
  search?: ConversationListParams['search']
  campaignId?: string
}

export function getConversationsQueryKey(params: UseConversationsQueryParams) {
  return [CONVERSATIONS_QUERY_KEY, params] as const
}

export function useConversationsQuery(params: UseConversationsQueryParams) {
  return useInfiniteQuery({
    queryKey: getConversationsQueryKey(params),
    queryFn: ({ pageParam }) => fetchConversations(params, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
    staleTime: 0,
    gcTime: GC_TIME,
  })
}

async function fetchConversations(
  params: UseConversationsQueryParams,
  cursor?: string,
) {
  const searchParams = new URLSearchParams()

  if (params.filter && params.filter !== 'all') {
    searchParams.set('filter', params.filter)
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (params.campaignId) {
    searchParams.set('campaign_id', params.campaignId)
  }
  if (cursor) {
    searchParams.set('cursor', cursor)
  }
  searchParams.set('limit', String(DEFAULT_LIMIT))

  const query = searchParams.toString()
  const url = `/api/v1/conversations${query ? `?${query}` : ''}`

  return customFetch<{
    data: ConversationListResponse
    status: number
    headers: Headers
  }>(url)
}
