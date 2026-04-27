import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import type { DomainEventEnvelope } from '#/shared/ws/events'
import type {
  MessageCreatedPayload,
  MessageReadBatchPayload,
  TypingStartedPayload,
  TypingStoppedPayload,
  PresenceUpdatedPayload,
} from '#/shared/ws/types'
import { useChatWsListeners } from './useChatWsListeners'

let mockWsHandlers: Record<string, (event: unknown) => void> = {}
let mockWsStatus = 'idle'
const mockSend = vi.fn()

vi.mock('#/shared/ws/useWebSocket', () => ({
  useWebSocket: (opts: {
    handlers?: Record<string, (event: unknown) => void>
    enabled?: boolean
  }) => {
    mockWsHandlers = opts.handlers ?? {}
    return { status: mockWsStatus, send: mockSend }
  },
}))

const CONVERSATION_ID = 'conv-123'
const OTHER_CONVERSATION_ID = 'conv-other'

function makeEnvelope<T>(
  eventType: string,
  payload: T,
): DomainEventEnvelope<T> {
  return {
    event_id: `evt-${Date.now()}`,
    event_type: eventType,
    schema_version: 'v1',
    aggregate_id: CONVERSATION_ID,
    aggregate_type: 'conversation',
    occurred_at: '2026-04-27T10:00:00Z',
    payload,
  }
}

describe('useChatWsListeners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWsStatus = 'idle'
    mockWsHandlers = {}
  })

  it('sends subscribe on mount when WS is open', () => {
    mockWsStatus = 'open'

    renderHook(() => useChatWsListeners(CONVERSATION_ID, { enabled: true }))

    expect(mockSend).toHaveBeenCalledWith({
      type: 'subscribe',
      topic: 'conversation',
      conversation_id: CONVERSATION_ID,
    })
  })

  it('sends unsubscribe on unmount', () => {
    mockWsStatus = 'open'

    const { unmount } = renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, { enabled: true }),
    )

    mockSend.mockClear()
    unmount()

    expect(mockSend).toHaveBeenCalledWith({
      type: 'unsubscribe',
      topic: 'conversation',
      conversation_id: CONVERSATION_ID,
    })
  })

  it('routes message.created to onMessageCreated', () => {
    mockWsStatus = 'open'
    const onMessageCreated = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onMessageCreated,
      }),
    )

    const payload: MessageCreatedPayload = {
      id: 'msg-1',
      client_message_id: null,
      conversation_id: CONVERSATION_ID,
      author_account_id: 'acc-1',
      type: 'text',
      text_content: 'Hello',
      created_at: '2026-04-27T10:00:00Z',
    }

    act(() => {
      mockWsHandlers['message.created']!(
        makeEnvelope('message.created', payload),
      )
    })

    expect(onMessageCreated).toHaveBeenCalledTimes(1)
    expect(onMessageCreated).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    )
  })

  it('routes message.read.batch to onMessageReadBatch', () => {
    mockWsStatus = 'open'
    const onMessageReadBatch = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onMessageReadBatch,
      }),
    )

    const payload: MessageReadBatchPayload = {
      conversation_id: CONVERSATION_ID,
      message_ids: ['msg-1', 'msg-2'],
      read_at: '2026-04-27T10:01:00Z',
    }

    act(() => {
      mockWsHandlers['message.read.batch']!(
        makeEnvelope('message.read.batch', payload),
      )
    })

    expect(onMessageReadBatch).toHaveBeenCalledTimes(1)
    expect(onMessageReadBatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    )
  })

  it('routes typing.started to onTypingStarted', () => {
    mockWsStatus = 'open'
    const onTypingStarted = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onTypingStarted,
      }),
    )

    const payload: TypingStartedPayload = {
      conversation_id: CONVERSATION_ID,
      actor_account_id: 'acc-2',
      actor_kind: 'creator',
    }

    act(() => {
      mockWsHandlers['typing.started']!(makeEnvelope('typing.started', payload))
    })

    expect(onTypingStarted).toHaveBeenCalledTimes(1)
    expect(onTypingStarted).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    )
  })

  it('routes typing.stopped to onTypingStopped', () => {
    mockWsStatus = 'open'
    const onTypingStopped = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onTypingStopped,
      }),
    )

    const payload: TypingStoppedPayload = {
      conversation_id: CONVERSATION_ID,
      actor_account_id: 'acc-2',
    }

    act(() => {
      mockWsHandlers['typing.stopped']!(makeEnvelope('typing.stopped', payload))
    })

    expect(onTypingStopped).toHaveBeenCalledTimes(1)
    expect(onTypingStopped).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    )
  })

  it('routes presence.updated to onPresenceUpdated', () => {
    mockWsStatus = 'open'
    const onPresenceUpdated = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onPresenceUpdated,
      }),
    )

    const payload: PresenceUpdatedPayload = {
      conversation_id: CONVERSATION_ID,
      counterpart_kind: 'creator_profile',
      counterpart_id: 'cp-1',
      state: 'online',
    }

    act(() => {
      mockWsHandlers['presence.updated']!(
        makeEnvelope('presence.updated', payload),
      )
    })

    expect(onPresenceUpdated).toHaveBeenCalledTimes(1)
    expect(onPresenceUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    )
  })

  it('ignores events for a different conversation', () => {
    mockWsStatus = 'open'
    const onMessageCreated = vi.fn()

    renderHook(() =>
      useChatWsListeners(CONVERSATION_ID, {
        enabled: true,
        onMessageCreated,
      }),
    )

    const payload: MessageCreatedPayload = {
      id: 'msg-99',
      client_message_id: null,
      conversation_id: OTHER_CONVERSATION_ID,
      author_account_id: 'acc-1',
      type: 'text',
      text_content: 'Wrong conversation',
      created_at: '2026-04-27T10:00:00Z',
    }

    act(() => {
      mockWsHandlers['message.created']!(
        makeEnvelope('message.created', payload),
      )
    })

    expect(onMessageCreated).not.toHaveBeenCalled()
  })

  it('does not subscribe when disabled', () => {
    mockWsStatus = 'idle'

    renderHook(() => useChatWsListeners(CONVERSATION_ID, { enabled: false }))

    expect(mockSend).not.toHaveBeenCalled()
  })
})
