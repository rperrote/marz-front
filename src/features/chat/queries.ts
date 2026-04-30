import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'
import { getMessagesQueryKey } from '#/shared/queries/messages'

import type {
  ConversationDetailResponse,
  MessagesParams,
  MessagesResponse,
} from './types'

const CONVERSATION_DETAIL_KEY = 'conversation-detail'
const DEFAULT_MESSAGES_LIMIT = 30

export function getConversationDetailQueryKey(conversationId: string) {
  return [CONVERSATION_DETAIL_KEY, conversationId] as const
}

// RAFITA:ANY: manual fetcher — conversations endpoints not yet in OpenAPI spec; replace with Orval hook after pnpm api:sync
export async function fetchConversationDetail(conversationId: string) {
  return customFetch<{ data: ConversationDetailResponse; status: number }>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
  )
}

export function useConversationDetailQuery(conversationId: string) {
  return useQuery({
    queryKey: getConversationDetailQueryKey(conversationId),
    queryFn: () => fetchConversationDetail(conversationId),
    select: (response) => response.data.data,
  })
}

// RAFITA:ANY: manual fetcher — conversations/messages endpoint not yet in OpenAPI spec; replace with Orval hook after pnpm api:sync
export async function fetchMessages(params: MessagesParams) {
  const searchParams = new URLSearchParams()

  if (params.beforeCursor) {
    searchParams.set('before_cursor', params.beforeCursor)
  }
  searchParams.set('limit', String(params.limit ?? DEFAULT_MESSAGES_LIMIT))

  const query = searchParams.toString()
  const url = `/api/v1/conversations/${encodeURIComponent(params.conversationId)}/messages${query ? `?${query}` : ''}`

  return customFetch<{ data: MessagesResponse; status: number }>(url)
}

export function useMessagesInfiniteQuery(conversationId: string) {
  return useInfiniteQuery({
    queryKey: getMessagesQueryKey(conversationId),
    queryFn: ({ pageParam }) =>
      fetchMessages({ conversationId, beforeCursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.next_before_cursor ?? undefined,
  })
}
