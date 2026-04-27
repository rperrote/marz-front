import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import { useChatWsListeners } from '#/features/chat/ws/useChatWsListeners'
import { handleMessageCreated } from '#/features/chat/ws/messageCreatedHandler'
import { useAutoMarkRead } from '#/features/chat/hooks/useAutoMarkRead'
import { useViewportAtBottom } from '#/features/chat/hooks/useViewportAtBottom'
import { usePresenceStore } from '#/features/chat/stores/presenceStore'
import { useTypingStore } from '#/features/chat/stores/typingStore'

import { ConversationHeader } from './ConversationHeader'
import { EmptyConversationFallback } from './EmptyConversationFallback'
import type { MessageTimelineHandle } from './MessageTimeline'
import { MessageTimeline } from './MessageTimeline'
import { MessageComposer } from './MessageComposer'
import { NewMessagesPill } from './NewMessagesPill'
import { TypingIndicator } from './TypingIndicator'

interface ConversationViewProps {
  conversationId: string
  currentAccountId: string
}

export function ConversationView({
  conversationId,
  currentAccountId,
}: ConversationViewProps) {
  const queryClient = useQueryClient()
  const detailQuery = useConversationDetailQuery(conversationId)
  const timelineRef = useRef<MessageTimelineHandle>(null)
  const { isAtBottom, onAtBottomStateChange } = useViewportAtBottom()
  const setPresence = usePresenceStore((s) => s.setPresence)
  const setTyping = useTypingStore((s) => s.setTyping)
  const clearTyping = useTypingStore((s) => s.clearTyping)

  useMessagesInfiniteQuery(conversationId)

  const { unreadCount, clearUnread, handleIncomingMessage } = useAutoMarkRead({
    conversationId,
    currentAccountId,
    isAtBottom,
  })

  useEffect(() => {
    if (!detailQuery.data) return
    const { counterpart, presence } = detailQuery.data
    setPresence(counterpart.id, presence.state)
  }, [detailQuery.data, setPresence])

  const onMessageCreated = useCallback(
    (envelope: Parameters<typeof handleMessageCreated>[1]) => {
      handleMessageCreated(queryClient, envelope, currentAccountId)
      handleIncomingMessage(envelope.payload.author_account_id)
      clearTyping(conversationId, envelope.payload.author_account_id)
    },
    [
      queryClient,
      currentAccountId,
      handleIncomingMessage,
      clearTyping,
      conversationId,
    ],
  )

  const onTypingStarted = useCallback(
    (envelope: { payload: { actor_account_id: string } }) => {
      setTyping(conversationId, envelope.payload.actor_account_id)
    },
    [conversationId, setTyping],
  )

  const onTypingStopped = useCallback(
    (envelope: { payload: { actor_account_id: string } }) => {
      clearTyping(conversationId, envelope.payload.actor_account_id)
    },
    [conversationId, clearTyping],
  )

  const onPresenceUpdated = useCallback(
    (envelope: {
      payload: {
        counterpart_id: string
        state: 'online' | 'offline' | 'disconnected'
      }
    }) => {
      setPresence(envelope.payload.counterpart_id, envelope.payload.state)
    },
    [setPresence],
  )

  const { send: wsSend } = useChatWsListeners(conversationId, {
    enabled: true,
    onMessageCreated,
    onTypingStarted,
    onTypingStopped,
    onPresenceUpdated,
  })

  const handlePillClick = useCallback(() => {
    timelineRef.current?.scrollToBottom()
    clearUnread()
  }, [clearUnread])

  if (detailQuery.isLoading) {
    return <ConversationViewSkeleton />
  }

  if (detailQuery.isError) {
    return <EmptyConversationFallback />
  }

  const conversation = detailQuery.data
  if (!conversation) {
    return <EmptyConversationFallback />
  }

  const canSend = conversation.can_send && conversation.counterpart.is_active

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader conversation={conversation} />

      <div className="relative flex-1 overflow-hidden">
        <MessageTimeline
          conversationId={conversationId}
          currentAccountId={currentAccountId}
          onAtBottomStateChange={onAtBottomStateChange}
          timelineRef={timelineRef}
        />
        <NewMessagesPill count={unreadCount} onClick={handlePillClick} />
      </div>

      <TypingIndicator
        conversationId={conversationId}
        currentAccountId={currentAccountId}
      />
      <MessageComposer
        conversationId={conversationId}
        currentAccountId={currentAccountId}
        canSend={canSend}
        wsSend={wsSend}
      />
    </div>
  )
}

function ConversationViewSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1" />
    </div>
  )
}
