import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

import type { ConversationListResponse, ConversationListItem } from './types'
import type { ConversationActivityPayload } from './conversationRailPatcher'
import { useWorkspaceRailSubscription } from './useWorkspaceRailSubscription'

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

function makeItem(id: string, unread = 0): ConversationListItem {
  return {
    id,
    counterpart: {
      kind: 'creator_profile',
      id: 'cp-1',
      display_name: 'Creator',
      avatar_url: null,
      handle: null,
    },
    last_activity_at: '2026-04-24T10:00:00Z',
    last_message_preview: {
      kind: 'text',
      text: 'Hello',
      author_is_self: false,
    },
    unread_count: unread,
    needs_reply: false,
    created_at: '2026-04-20T10:00:00Z',
  }
}

type InfiniteConversations = InfiniteData<
  { data: ConversationListResponse },
  string | undefined
>

function makeInfiniteData(
  items: ConversationListItem[],
): InfiniteConversations {
  return {
    pages: [
      {
        data: { data: items, next_cursor: null, total_visible: items.length },
      },
    ],
    pageParams: [undefined],
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useWorkspaceRailSubscription', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockWsStatus = 'idle'
    mockWsHandlers = {}
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('sends subscribe message when WS opens', () => {
    mockWsStatus = 'open'

    renderHook(() => useWorkspaceRailSubscription({ enabled: true }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: 'subscribe',
      topic: 'workspace_rail',
    })
  })

  it('patches cache when conversation.activity_updated arrives', () => {
    mockWsStatus = 'open'

    const initialData = makeInfiniteData([
      makeItem('conv-0'),
      makeItem('conv-1', 2),
    ])

    queryClient.setQueryData(['conversations', { filter: 'all' }], initialData)

    renderHook(() => useWorkspaceRailSubscription({ enabled: true }), {
      wrapper: createWrapper(queryClient),
    })

    const handler = mockWsHandlers['conversation.activity_updated']
    expect(handler).toBeDefined()

    const payload: ConversationActivityPayload = {
      conversation_id: 'conv-1',
      last_activity_at: '2026-04-24T18:00:00Z',
      last_message_id: 'msg-1',
      last_message_preview: {
        kind: 'text',
        text: 'New message',
        author_is_self: false,
      },
      unread_count_delta: 1,
    }

    act(() => {
      handler!({
        event_id: 'evt-1',
        event_type: 'conversation.activity_updated',
        schema_version: 'v1',
        aggregate_id: 'conv-1',
        aggregate_type: 'conversation',
        occurred_at: '2026-04-24T18:00:00Z',
        payload,
      })
    })

    const updated = queryClient.getQueryData<InfiniteConversations>([
      'conversations',
      { filter: 'all' },
    ])

    expect(updated!.pages[0]!.data.data[0]!.id).toBe('conv-1')
    expect(updated!.pages[0]!.data.data[0]!.unread_count).toBe(3)
    expect(updated!.pages[0]!.data.data[0]!.last_message_preview.text).toBe(
      'New message',
    )
  })

  it('invalidates queries on window focus', () => {
    mockWsStatus = 'open'

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useWorkspaceRailSubscription({ enabled: true }), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['conversations'],
    })
  })

  it('invalidates queries on WS reopen (open → closed → open)', () => {
    mockWsStatus = 'open'

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { rerender } = renderHook(
      () => useWorkspaceRailSubscription({ enabled: true }),
      { wrapper: createWrapper(queryClient) },
    )

    invalidateSpy.mockClear()

    mockWsStatus = 'closed'
    rerender()

    expect(invalidateSpy).not.toHaveBeenCalled()

    mockWsStatus = 'open'
    rerender()

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['conversations'],
    })
  })

  it('does not subscribe or listen when disabled', () => {
    mockWsStatus = 'idle'

    renderHook(() => useWorkspaceRailSubscription({ enabled: false }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mockSend).not.toHaveBeenCalled()
  })
})
