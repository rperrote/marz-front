import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useWebSocket } from '#/shared/ws/useWebSocket'
import { useTypingStore } from '#/features/chat/stores/typingStore'
import { createWsHandlers } from '#/shared/ws/handlers'
import type { ChatWsHandlers } from './types'
import { buildChatHandlers } from './listeners'

interface UseChatWsListenersOptions extends ChatWsHandlers {
  enabled?: boolean
}

export function useChatWsListeners(
  conversationId: string,
  {
    enabled = false,
    onMessageCreated,
    onMessageReadBatch,
    onTypingStarted,
    onTypingStopped,
    onPresenceUpdated,
  }: UseChatWsListenersOptions = {},
) {
  const queryClient = useQueryClient()
  const handlersRef = useRef<ChatWsHandlers>({
    onMessageCreated,
    onMessageReadBatch,
    onTypingStarted,
    onTypingStopped,
    onPresenceUpdated,
  })
  handlersRef.current = {
    onMessageCreated,
    onMessageReadBatch,
    onTypingStarted,
    onTypingStopped,
    onPresenceUpdated,
  }

  const stableHandlers = useMemo(() => {
    const proxy: ChatWsHandlers = {
      onMessageCreated: (e) => handlersRef.current.onMessageCreated?.(e),
      onMessageReadBatch: (e) => handlersRef.current.onMessageReadBatch?.(e),
      onTypingStarted: (e) => handlersRef.current.onTypingStarted?.(e),
      onTypingStopped: (e) => handlersRef.current.onTypingStopped?.(e),
      onPresenceUpdated: (e) => handlersRef.current.onPresenceUpdated?.(e),
    }
    return {
      ...createWsHandlers(queryClient),
      ...buildChatHandlers(conversationId, proxy),
    }
  }, [conversationId, queryClient])

  const { status, send } = useWebSocket({
    handlers: stableHandlers,
    enabled,
  })

  const clearAllTyping = useTypingStore((s) => s.clearAll)

  useEffect(() => {
    if (status === 'closed') {
      clearAllTyping()
    }
  }, [status, clearAllTyping])

  useEffect(() => {
    if (status !== 'open') return

    send({
      type: 'subscribe',
      topic: 'conversation',
      conversation_id: conversationId,
    })

    // Known limitation: if the socket closes before unmount, send() is a no-op
    // and the unsubscribe never reaches the server. A pending-unsubscribe queue
    // sent on reconnect would fix this; tracked for when reconnection lands.
    return () => {
      send({
        type: 'unsubscribe',
        topic: 'conversation',
        conversation_id: conversationId,
      })
    }
  }, [status, send, conversationId])

  return { status, send }
}
