import { QueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import type { DomainEventEnvelope } from '#/shared/ws/events'
import type { MessageCreatedPayload } from '#/shared/ws/types'
import { getMessagesQueryKey } from '#/features/chat/queries'
import type { MessagesResponse } from '#/features/chat/types'

import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import { handleMessageCreated } from './messageCreatedHandler'

type MessagesInfiniteData = InfiniteData<
  { data: MessagesResponse; status: number },
  string | undefined
>

const CONVERSATION_ID = 'conv-1'

function makeTextPayload(
  overrides: Partial<{
    id: string
    client_message_id: string | null
    conversation_id: string
    author_account_id: string
    text_content: string
    created_at: string
  }> = {},
): MessageCreatedPayload {
  return {
    id: 'server-msg-1',
    client_message_id: null,
    conversation_id: CONVERSATION_ID,
    author_account_id: 'acc-other',
    type: 'text' as const,
    text_content: 'hi there',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function makeEnvelope(
  payloadOverrides: Parameters<typeof makeTextPayload>[0] = {},
): DomainEventEnvelope<MessageCreatedPayload> {
  return {
    event_id: 'evt-1',
    event_type: 'message.created',
    schema_version: '1.0',
    aggregate_id: CONVERSATION_ID,
    aggregate_type: 'conversation',
    occurred_at: '2026-04-01T00:00:00Z',
    payload: makeTextPayload(payloadOverrides),
  }
}

function makeSystemEventEnvelope(overrides: {
  id?: string
  event_type: string
  payload: Record<string, unknown>
  author_account_id?: string
}): DomainEventEnvelope<MessageCreatedPayload> {
  return {
    event_id: 'evt-sys-1',
    event_type: 'message.created',
    schema_version: '1.0',
    aggregate_id: CONVERSATION_ID,
    aggregate_type: 'conversation',
    occurred_at: '2026-04-01T00:00:00Z',
    payload: {
      id: overrides.id ?? 'sys-msg-1',
      client_message_id: null,
      conversation_id: CONVERSATION_ID,
      author_account_id: overrides.author_account_id ?? 'acc-brand',
      type: 'system_event' as const,
      text_content: null,
      event_type: overrides.event_type,
      payload: overrides.payload,
      created_at: '2026-04-01T00:00:00Z',
    },
  }
}

function seedCache(
  queryClient: QueryClient,
  messages: MessagesResponse['data'],
) {
  const key = getMessagesQueryKey(CONVERSATION_ID)
  const data: MessagesInfiniteData = {
    pages: [
      {
        data: { data: messages, next_before_cursor: null, has_more: false },
        status: 200,
      },
    ],
    pageParams: [undefined],
  }
  queryClient.setQueryData(key, data)
}

describe('handleMessageCreated', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('reconciles a pending message by client_message_id', () => {
    seedCache(queryClient, [
      {
        id: 'client-id-1',
        conversation_id: CONVERSATION_ID,
        author_account_id: 'acc-1',
        type: 'text',
        text_content: 'hello',
        event_type: null,
        payload: null,
        created_at: '2026-04-01T00:00:00Z',
        read_by_self: true,
      },
    ])

    handleMessageCreated(
      queryClient,
      makeEnvelope({
        id: 'server-msg-1',
        client_message_id: 'client-id-1',
        author_account_id: 'acc-1',
        text_content: 'hello',
      }),
      'acc-1',
    )

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    const messages = cache?.pages[0]?.data.data
    expect(messages).toHaveLength(1)
    expect(messages?.[0]?.id).toBe('server-msg-1')
    expect(messages?.[0]?.read_by_self).toBe(true)
  })

  it('appends incoming message from other user', () => {
    seedCache(queryClient, [])

    handleMessageCreated(queryClient, makeEnvelope(), 'acc-1')

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    const messages = cache?.pages[0]?.data.data
    expect(messages).toHaveLength(1)
    expect(messages?.[0]?.id).toBe('server-msg-1')
    expect(messages?.[0]?.read_by_self).toBe(false)
  })

  it('prepends incoming message before existing messages (descending order)', () => {
    seedCache(queryClient, [
      {
        id: 'old-msg',
        conversation_id: CONVERSATION_ID,
        author_account_id: 'acc-other',
        type: 'text',
        text_content: 'older message',
        event_type: null,
        payload: null,
        created_at: '2026-03-31T00:00:00Z',
        read_by_self: true,
      },
    ])

    handleMessageCreated(queryClient, makeEnvelope(), 'acc-1')

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    const messages = cache?.pages[0]?.data.data
    expect(messages).toHaveLength(2)
    expect(messages?.[0]?.id).toBe('server-msg-1')
    expect(messages?.[1]?.id).toBe('old-msg')
  })

  it('sets read_by_self true for own messages', () => {
    seedCache(queryClient, [])

    handleMessageCreated(
      queryClient,
      makeEnvelope({ author_account_id: 'acc-1' }),
      'acc-1',
    )

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    expect(cache?.pages[0]?.data.data[0]?.read_by_self).toBe(true)
  })

  it('does not duplicate if message already exists by id', () => {
    seedCache(queryClient, [
      {
        id: 'server-msg-1',
        conversation_id: CONVERSATION_ID,
        author_account_id: 'acc-other',
        type: 'text',
        text_content: 'hi there',
        event_type: null,
        payload: null,
        created_at: '2026-04-01T00:00:00Z',
        read_by_self: false,
      },
    ])

    handleMessageCreated(queryClient, makeEnvelope(), 'acc-1')

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    expect(cache?.pages[0]?.data.data).toHaveLength(1)
  })

  it('inserts system_event message into cache', () => {
    seedCache(queryClient, [])

    handleMessageCreated(
      queryClient,
      makeSystemEventEnvelope({
        event_type: 'offer_sent',
        payload: { snapshot: { offer_id: 'off-1' } },
      }),
      'acc-1',
    )

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    const messages = cache?.pages[0]?.data.data
    expect(messages).toHaveLength(1)
    expect(messages?.[0]?.type).toBe('system_event')
    expect(messages?.[0]?.event_type).toBe('offer_sent')
    expect(messages?.[0]?.payload).toEqual({ snapshot: { offer_id: 'off-1' } })
  })

  it.each(['offer_sent', 'offer_accepted', 'offer_rejected', 'offer_expired'])(
    'invalidates offers query for %s event',
    (eventType) => {
      seedCache(queryClient, [])

      const offersKey = getConversationOffersQueryKey(CONVERSATION_ID)
      queryClient.setQueryData(offersKey, {
        current: null,
        archive: { items: [], next_cursor: null },
      })

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      handleMessageCreated(
        queryClient,
        makeSystemEventEnvelope({
          id: `sys-${eventType}`,
          event_type: eventType,
          payload: { snapshot: {} },
        }),
        'acc-1',
      )

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: offersKey,
      })
    },
  )

  it('does not invalidate offers query for non-offer system events', () => {
    seedCache(queryClient, [])

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    handleMessageCreated(
      queryClient,
      makeSystemEventEnvelope({
        event_type: 'deliverable_submitted',
        payload: { snapshot: {} },
      }),
      'acc-1',
    )

    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('does not duplicate system_event message if already exists', () => {
    seedCache(queryClient, [
      {
        id: 'sys-msg-1',
        conversation_id: CONVERSATION_ID,
        author_account_id: 'acc-brand',
        type: 'system_event',
        text_content: null,
        event_type: 'offer_sent',
        payload: { snapshot: {} },
        created_at: '2026-04-01T00:00:00Z',
        read_by_self: false,
      },
    ])

    handleMessageCreated(
      queryClient,
      makeSystemEventEnvelope({
        event_type: 'offer_sent',
        payload: { snapshot: {} },
      }),
      'acc-1',
    )

    const key = getMessagesQueryKey(CONVERSATION_ID)
    const cache = queryClient.getQueryData<MessagesInfiniteData>(key)
    expect(cache?.pages[0]?.data.data).toHaveLength(1)
  })
})
