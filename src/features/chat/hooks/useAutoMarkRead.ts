import { useCallback, useEffect, useRef, useState } from 'react'

import { useMarkConversationReadMutation } from '#/features/chat/mutations/useMarkConversationReadMutation'

const DEBOUNCE_MS = 800

interface UseAutoMarkReadOptions {
  conversationId: string
  currentAccountId: string
  isAtBottom: boolean
}

export interface UseAutoMarkReadReturn {
  unreadCount: number
  clearUnread: () => void
  handleIncomingMessage: (authorAccountId: string) => void
}

export function useAutoMarkRead({
  conversationId,
  currentAccountId,
  isAtBottom,
}: UseAutoMarkReadOptions): UseAutoMarkReadReturn {
  const { mutate: markRead } = useMarkConversationReadMutation(conversationId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unreadCountRef = useRef(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const debouncedMarkRead = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      markRead()
      unreadCountRef.current = 0
      setUnreadCount(0)
    }, DEBOUNCE_MS)
  }, [markRead])

  // Mark read on mount (entering conversation)
  useEffect(() => {
    debouncedMarkRead()
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [conversationId, debouncedMarkRead])

  const handleIncomingMessage = useCallback(
    (authorAccountId: string) => {
      if (authorAccountId === currentAccountId) return

      if (isAtBottom && document.hasFocus()) {
        debouncedMarkRead()
      } else {
        unreadCountRef.current += 1
        setUnreadCount(unreadCountRef.current)
      }
    },
    [currentAccountId, isAtBottom, debouncedMarkRead],
  )

  const clearUnread = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    unreadCountRef.current = 0
    setUnreadCount(0)
    markRead()
  }, [markRead])

  // When user scrolls back to bottom while there are unreads
  useEffect(() => {
    if (!isAtBottom || !document.hasFocus() || unreadCountRef.current === 0)
      return
    debouncedMarkRead()
  }, [isAtBottom, debouncedMarkRead])

  // When tab regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAtBottom && unreadCountRef.current > 0) {
        debouncedMarkRead()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAtBottom, debouncedMarkRead])

  return { unreadCount, clearUnread, handleIncomingMessage }
}
