import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { getConversation, listMessages } from '#/shared/api/generated/chat/chat'
import type {
  ConversationDetail,
  MessageListItem,
  MessageListResponse,
} from '#/shared/api/generated/model'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { toMessagePayload } from '#/features/chat/utils/messagePayload'
import type {
  ConversationDetailResponse,
  MessageItem,
  MessagesParams,
  MessagesResponse,
} from './types'

const CONVERSATION_DETAIL_KEY = 'conversation-detail'
const DEFAULT_MESSAGES_LIMIT = 30

export function getConversationDetailQueryKey(conversationId: string) {
  return [CONVERSATION_DETAIL_KEY, conversationId] as const
}

// `customFetch` (mutator) throws on non-2xx; the union with Error in the
// generated response type is defensive — runtime always reaches the 200 branch.
export async function fetchConversationDetail(
  conversationId: string,
): Promise<ConversationDetailResponse> {
  const res = (await getConversation(conversationId)) as {
    data: ConversationDetail
  }
  return { data: res.data }
}

export function useConversationDetailQuery(conversationId: string) {
  return useQuery({
    queryKey: getConversationDetailQueryKey(conversationId),
    queryFn: () => fetchConversationDetail(conversationId),
    select: (response) => response.data,
  })
}

function toFlatMessage(
  conversationId: string,
  item: MessageListItem,
): MessageItem {
  if (item.type === 'text') {
    return {
      id: item.id,
      conversation_id: conversationId,
      author_account_id: item.author_account_id,
      type: 'text',
      text_content: item.text,
      event_type: null,
      payload: null,
      created_at: item.created_at,
      read_by_self: item.read_by_self,
    }
  }
  return {
    id: item.id,
    conversation_id: conversationId,
    author_account_id: null,
    type: 'system_event',
    text_content: null,
    event_type: item.event_type,
    payload: toMessagePayload(item.payload),
    created_at: item.created_at,
    read_by_self: item.read_by_self,
  }
}

export async function fetchMessages(
  params: MessagesParams,
): Promise<{ data: MessagesResponse; status: number }> {
  const res = (await listMessages(params.conversationId, {
    ...(params.beforeCursor ? { before_cursor: params.beforeCursor } : {}),
    limit: params.limit ?? DEFAULT_MESSAGES_LIMIT,
  })) as { data: MessageListResponse; status: number }

  return {
    data: {
      data: res.data.items.map((item) =>
        toFlatMessage(params.conversationId, item),
      ),
      next_before_cursor: res.data.next_before_cursor ?? null,
      has_more: res.data.has_more,
    },
    status: res.status,
  }
}

export function useMessagesInfiniteQuery(conversationId: string) {
  return useInfiniteQuery({
    queryKey: getMessagesQueryKey(conversationId),
    queryFn: ({ pageParam }) =>
      fetchMessages({ conversationId, beforeCursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.next_before_cursor ?? undefined,
    // Live updates come via WebSocket (handleMessageCreated) — refetching on
    // every focus/mount would race the optimistic insert and clobber it with
    // an empty list before the WS event has had a chance to land in cache.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
