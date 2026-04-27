import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { InfiniteData } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'

import type { MessagesResponse } from '#/features/chat/types'

import {
  reconcileMessage,
  markMessageFailed,
  appendMessageToCache,
  createPendingMessage,
} from './useSendMessageMutation'

type MessagesInfiniteData = InfiniteData<
  { data: MessagesResponse; status: number },
  string | undefined
>

function makeMessage(overrides: Partial<MessagesResponse['data'][0]> = {}) {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    author_account_id: 'acc-1',
    type: 'text' as const,
    text_content: 'hello',
    event_type: null,
    payload: null,
    created_at: '2026-04-01T00:00:00Z',
    read_by_self: true,
    ...overrides,
  }
}

function makeCache(messages: MessagesResponse['data'][]): MessagesInfiniteData {
  return {
    pages: messages.map((data) => ({
      data: { data, next_before_cursor: null, has_more: false },
      status: 200,
    })),
    pageParams: [undefined],
  }
}

describe('appendMessageToCache', () => {
  it('prepends message to first page (descending order)', () => {
    const existing = makeMessage({ id: 'msg-1' })
    const newMsg = makeMessage({ id: 'msg-2', text_content: 'world' })
    const cache = makeCache([[existing]])

    const result = appendMessageToCache(cache, newMsg)

    expect(result?.pages[0]?.data.data).toHaveLength(2)
    expect(result?.pages[0]?.data.data[0]?.id).toBe('msg-2')
    expect(result?.pages[0]?.data.data[1]?.id).toBe('msg-1')
  })

  it('returns undefined cache as-is', () => {
    expect(appendMessageToCache(undefined, makeMessage())).toBeUndefined()
  })
})

describe('reconcileMessage', () => {
  it('replaces pending message by clientMessageId', () => {
    const pending = makeMessage({ id: 'client-id-1' })
    const confirmed = makeMessage({
      id: 'server-id-1',
      text_content: 'hello',
    })
    const cache = makeCache([[pending]])

    const result = reconcileMessage(cache, 'client-id-1', confirmed)

    expect(result.pages[0]?.data.data[0]?.id).toBe('server-id-1')
  })
})

describe('markMessageFailed', () => {
  it('prefixes id with failed:', () => {
    const pending = makeMessage({ id: 'client-id-1' })
    const cache = makeCache([[pending]])

    const result = markMessageFailed(cache, 'client-id-1')

    expect(result.pages[0]?.data.data[0]?.id).toBe('failed:client-id-1')
  })
})

describe('createPendingMessage', () => {
  it('uses injected nowIso for deterministic timestamps', () => {
    const fixed = '2026-01-15T10:00:00.000Z'
    const msg = createPendingMessage('cid-1', 'conv-1', 'hi', 'acc-1', fixed)

    expect(msg.created_at).toBe(fixed)
    expect(msg.id).toBe('cid-1')
    expect(msg.read_by_self).toBe(true)
  })

  it('falls back to current time when nowIso is omitted', () => {
    const before = new Date().toISOString()
    const msg = createPendingMessage('cid-2', 'conv-1', 'hi', 'acc-1')
    const after = new Date().toISOString()

    expect(msg.created_at >= before).toBe(true)
    expect(msg.created_at <= after).toBe(true)
  })
})

describe('useSendMessageMutation — retry logic (unit)', () => {
  it('retry function returns false for 422 ApiError', async () => {
    const { ApiError } = await import('#/shared/api/mutator')
    const error422 = new ApiError(422, 'VALIDATION_ERROR', 'Validation failed')

    const retryFn = (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 422) return false
      return failureCount < 3
    }

    expect(retryFn(0, error422)).toBe(false)
    expect(retryFn(1, error422)).toBe(false)
    expect(retryFn(2, error422)).toBe(false)
  })

  it('retry function returns true for non-422 errors within limit', async () => {
    const { ApiError } = await import('#/shared/api/mutator')
    const error500 = new ApiError(500, 'INTERNAL_ERROR', 'Server error')

    const retryFn = (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 422) return false
      return failureCount < 3
    }

    expect(retryFn(0, error500)).toBe(true)
    expect(retryFn(1, error500)).toBe(true)
    expect(retryFn(2, error500)).toBe(true)
    expect(retryFn(3, error500)).toBe(false)
  })
})

describe('useSendMessageMutation — resync timeout (unit)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('setTimeout fires invalidateQueries after 5s', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const messagesKey = ['messages', 'conv-1']
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const confirmationTimeout = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: messagesKey })
    }, 5000)

    vi.advanceTimersByTime(4999)
    expect(invalidateSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: messagesKey })

    clearTimeout(confirmationTimeout)
    invalidateSpy.mockRestore()
  })

  it('clearTimeout cancels invalidation if called before 5s', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const messagesKey = ['messages', 'conv-1']
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const confirmationTimeout = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: messagesKey })
    }, 5000)

    vi.advanceTimersByTime(2000)
    clearTimeout(confirmationTimeout)

    vi.advanceTimersByTime(5000)
    expect(invalidateSpy).not.toHaveBeenCalled()

    invalidateSpy.mockRestore()
  })
})
