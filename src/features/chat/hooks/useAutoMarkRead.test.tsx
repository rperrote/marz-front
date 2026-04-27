import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useAutoMarkRead } from './useAutoMarkRead'

const mockMutate = vi.fn()

vi.mock('#/features/chat/mutations/useMarkConversationReadMutation', () => ({
  useMarkConversationReadMutation: () => ({ mutate: mockMutate }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useAutoMarkRead', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockMutate.mockClear()
    Object.defineProperty(document, 'hasFocus', {
      value: () => true,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks read on mount after debounce', () => {
    renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: true,
        }),
      { wrapper: createWrapper() },
    )

    expect(mockMutate).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(800))
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('marks read when incoming message from counterpart with viewport at bottom and focused', () => {
    const { result } = renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: true,
        }),
      { wrapper: createWrapper() },
    )

    act(() => vi.advanceTimersByTime(800))
    mockMutate.mockClear()

    act(() => {
      result.current.handleIncomingMessage('other-user')
    })

    act(() => vi.advanceTimersByTime(800))
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('accumulates unread count when viewport not at bottom', () => {
    const { result } = renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: false,
        }),
      { wrapper: createWrapper() },
    )

    act(() => vi.advanceTimersByTime(800))
    mockMutate.mockClear()

    act(() => {
      result.current.handleIncomingMessage('other-user')
    })
    expect(result.current.unreadCount).toBe(1)

    act(() => {
      result.current.handleIncomingMessage('other-user')
    })
    expect(result.current.unreadCount).toBe(2)

    act(() => vi.advanceTimersByTime(800))
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does not mark read when tab not focused', () => {
    Object.defineProperty(document, 'hasFocus', {
      value: () => false,
      configurable: true,
    })

    const { result } = renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: true,
        }),
      { wrapper: createWrapper() },
    )

    act(() => vi.advanceTimersByTime(800))
    mockMutate.mockClear()

    act(() => {
      result.current.handleIncomingMessage('other-user')
    })

    act(() => vi.advanceTimersByTime(800))
    expect(mockMutate).not.toHaveBeenCalled()
    expect(result.current.unreadCount).toBe(1)
  })

  it('ignores messages from self', () => {
    const { result } = renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: false,
        }),
      { wrapper: createWrapper() },
    )

    act(() => vi.advanceTimersByTime(800))

    act(() => {
      result.current.handleIncomingMessage('me')
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('clearUnread resets count and fires mark-read immediately', () => {
    const { result } = renderHook(
      () =>
        useAutoMarkRead({
          conversationId: 'conv-1',
          currentAccountId: 'me',
          isAtBottom: false,
        }),
      { wrapper: createWrapper() },
    )

    act(() => vi.advanceTimersByTime(800))
    mockMutate.mockClear()

    act(() => {
      result.current.handleIncomingMessage('other-user')
      result.current.handleIncomingMessage('other-user')
    })
    expect(result.current.unreadCount).toBe(2)

    act(() => {
      result.current.clearUnread()
    })

    expect(result.current.unreadCount).toBe(0)
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })
})
