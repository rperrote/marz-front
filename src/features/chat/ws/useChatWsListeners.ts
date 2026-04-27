import { useEffect, useMemo, useRef } from 'react'

import { useWebSocket } from '#/shared/ws/useWebSocket'
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
    return buildChatHandlers(conversationId, proxy)
  }, [conversationId])

  const { status, send } = useWebSocket({
    handlers: stableHandlers,
    enabled,
  })

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

  return { status }
}
