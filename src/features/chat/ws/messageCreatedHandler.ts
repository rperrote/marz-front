import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { DomainEventEnvelope } from '#/shared/ws/events'
import type { MessageCreatedPayload } from '#/shared/ws/types'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import { OFFER_EVENT_TYPES } from '#/shared/offers/constants'
import type { MessageItem, MessagesResponse } from '#/features/chat/types'

type MessagesInfiniteData = InfiniteData<
  { data: MessagesResponse; status: number },
  string | undefined
>

export function handleMessageCreated(
  queryClient: QueryClient,
  envelope: DomainEventEnvelope<MessageCreatedPayload>,
  currentAccountId: string,
) {
  const { payload } = envelope
  const messagesKey = getMessagesQueryKey(payload.conversation_id)

  const confirmedMessage: MessageItem =
    payload.type === 'system_event'
      ? {
          id: payload.id,
          conversation_id: payload.conversation_id,
          author_account_id: payload.author_account_id,
          type: 'system_event',
          text_content: null,
          event_type: payload.event_type,
          payload: payload.payload,
          created_at: payload.created_at,
          read_by_self: payload.author_account_id === currentAccountId,
        }
      : {
          id: payload.id,
          conversation_id: payload.conversation_id,
          author_account_id: payload.author_account_id,
          type: 'text',
          text_content: payload.text_content,
          event_type: null,
          payload: null,
          created_at: payload.created_at,
          read_by_self: payload.author_account_id === currentAccountId,
        }

  queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
    if (!old || old.pages.length === 0) return old

    const clientMessageId = payload.client_message_id
    if (clientMessageId) {
      const found = old.pages.some((page) =>
        page.data.data.some((msg) => msg.id === clientMessageId),
      )
      if (found) {
        return replaceByClientMessageId(old, clientMessageId, confirmedMessage)
      }
    }

    const alreadyExists = old.pages.some((page) =>
      page.data.data.some((msg) => msg.id === payload.id),
    )
    if (alreadyExists) return old

    return appendToFirstPage(old, confirmedMessage)
  })

  if (
    payload.type === 'system_event' &&
    OFFER_EVENT_TYPES.has(payload.event_type)
  ) {
    queryClient.invalidateQueries({
      queryKey: getConversationOffersQueryKey(payload.conversation_id),
    })
  }
}

function replaceByClientMessageId(
  cache: MessagesInfiniteData,
  clientMessageId: string,
  confirmedMessage: MessageItem,
): MessagesInfiniteData {
  const pages = cache.pages.map((page) => ({
    ...page,
    data: {
      ...page.data,
      data: page.data.data.map((msg) =>
        msg.id === clientMessageId ? confirmedMessage : msg,
      ),
    },
  }))
  return { ...cache, pages }
}

function appendToFirstPage(
  cache: MessagesInfiniteData,
  message: MessageItem,
): MessagesInfiniteData {
  const pages = [...cache.pages]
  const firstPage = pages[0]!
  pages[0] = {
    ...firstPage,
    data: {
      ...firstPage.data,
      data: [message, ...firstPage.data.data],
    },
  }
  return { ...cache, pages }
}
