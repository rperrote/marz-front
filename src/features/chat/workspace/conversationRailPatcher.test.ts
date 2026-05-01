import { describe, it, expect } from 'vitest'
import type { InfiniteData } from '@tanstack/react-query'

import type { ConversationListItem, ConversationListResponse } from './types'
import type { ConversationActivityPayload } from './conversationRailPatcher'
import { applyActivityUpdate } from './conversationRailPatcher'

type InfiniteConversations = InfiniteData<
  { data: ConversationListResponse },
  string | undefined
>

function makeItem(
  overrides: Partial<ConversationListItem> & { id: string },
): ConversationListItem {
  return {
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
    unread_count: 0,
    needs_reply: false,
    created_at: '2026-04-20T10:00:00Z',
    ...overrides,
  }
}

function makeSinglePageData(
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

function makeMultiPageData(
  pages: ConversationListItem[][],
): InfiniteConversations {
  return {
    pages: pages.map((items, i) => ({
      data: {
        data: items,
        next_cursor: i < pages.length - 1 ? `cursor-${i + 1}` : null,
        total_visible: items.length,
      },
    })),
    pageParams: [undefined, ...pages.slice(1).map((_, i) => `cursor-${i + 1}`)],
  }
}

function makePayload(
  overrides: Partial<ConversationActivityPayload> = {},
): ConversationActivityPayload {
  return {
    conversation_id: 'conv-1',
    last_activity_at: '2026-04-24T18:00:00Z',
    last_message_id: 'msg-1',
    last_message_preview: {
      kind: 'text',
      text: 'New message',
      author_is_self: false,
    },
    unread_count_delta: 1,
    ...overrides,
  }
}

describe('applyActivityUpdate', () => {
  it('moves item to top of first page when found on first page', () => {
    const data = makeSinglePageData([
      makeItem({ id: 'conv-0' }),
      makeItem({ id: 'conv-1', unread_count: 2 }),
      makeItem({ id: 'conv-2' }),
    ])

    const result = applyActivityUpdate(data, makePayload())
    const items = result.pages[0]!.data.data

    expect(items[0]!.id).toBe('conv-1')
    expect(items[0]!.last_activity_at).toBe('2026-04-24T18:00:00Z')
    expect(items[0]!.last_message_preview.text).toBe('New message')
    expect(items[0]!.unread_count).toBe(3)
    expect(items[1]!.id).toBe('conv-0')
    expect(items[2]!.id).toBe('conv-2')
  })

  it('moves item from second page to top of first page', () => {
    const data = makeMultiPageData([
      [makeItem({ id: 'conv-0' }), makeItem({ id: 'conv-1' })],
      [makeItem({ id: 'conv-2', unread_count: 0 }), makeItem({ id: 'conv-3' })],
    ])

    const result = applyActivityUpdate(
      data,
      makePayload({ conversation_id: 'conv-2' }),
    )

    const firstPage = result.pages[0]!.data.data
    expect(firstPage[0]!.id).toBe('conv-2')
    expect(firstPage.length).toBe(3)

    const secondPage = result.pages[1]!.data.data
    expect(secondPage.length).toBe(1)
    expect(secondPage[0]!.id).toBe('conv-3')
  })

  it('returns data unchanged when conversation_id is not in cache', () => {
    const data = makeSinglePageData([
      makeItem({ id: 'conv-0' }),
      makeItem({ id: 'conv-1' }),
    ])

    const result = applyActivityUpdate(
      data,
      makePayload({ conversation_id: 'conv-unknown' }),
    )

    expect(result).toBe(data)
  })

  it('does not increment unread_count when author_is_self is true', () => {
    const data = makeSinglePageData([
      makeItem({ id: 'conv-0' }),
      makeItem({ id: 'conv-1', unread_count: 5 }),
    ])

    const result = applyActivityUpdate(
      data,
      makePayload({
        last_message_preview: {
          kind: 'text',
          text: 'My own message',
          author_is_self: true,
        },
        unread_count_delta: 1,
      }),
    )

    const items = result.pages[0]!.data.data
    expect(items[0]!.id).toBe('conv-1')
    expect(items[0]!.unread_count).toBe(5)
  })

  it('increments unread_count by delta when author_is_self is false', () => {
    const data = makeSinglePageData([
      makeItem({ id: 'conv-1', unread_count: 3 }),
    ])

    const result = applyActivityUpdate(
      data,
      makePayload({ unread_count_delta: 2 }),
    )

    expect(result.pages[0]!.data.data[0]!.unread_count).toBe(5)
  })

  it('handles item already at top of first page', () => {
    const data = makeSinglePageData([
      makeItem({ id: 'conv-1', unread_count: 0 }),
      makeItem({ id: 'conv-2' }),
    ])

    const result = applyActivityUpdate(data, makePayload())
    const items = result.pages[0]!.data.data

    expect(items[0]!.id).toBe('conv-1')
    expect(items[0]!.unread_count).toBe(1)
    expect(items.length).toBe(2)
  })

  it('preserves other pages when item is on first page', () => {
    const data = makeMultiPageData([
      [makeItem({ id: 'conv-0' }), makeItem({ id: 'conv-1' })],
      [makeItem({ id: 'conv-2' }), makeItem({ id: 'conv-3' })],
    ])

    const result = applyActivityUpdate(data, makePayload())
    expect(result.pages[1]).toBe(data.pages[1])
  })
})
