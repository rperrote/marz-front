import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import { useChatWsListeners } from '#/features/chat/ws/useChatWsListeners'
import { handleMessageCreated } from '#/features/chat/ws/messageCreatedHandler'
import { useAutoMarkRead } from '#/features/chat/hooks/useAutoMarkRead'
import { useViewportAtBottom } from '#/features/chat/hooks/useViewportAtBottom'

import { ConversationHeader } from './ConversationHeader'
import { EmptyConversationFallback } from './EmptyConversationFallback'
import type { MessageTimelineHandle } from './MessageTimeline'
import { MessageTimeline } from './MessageTimeline'
import { MessageComposer } from './MessageComposer'
import { NewMessagesPill } from './NewMessagesPill'

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

  useMessagesInfiniteQuery(conversationId)

  const { unreadCount, clearUnread, handleIncomingMessage } = useAutoMarkRead({
    conversationId,
    currentAccountId,
    isAtBottom,
  })

  const onMessageCreated = useCallback(
    (envelope: Parameters<typeof handleMessageCreated>[1]) => {
      handleMessageCreated(queryClient, envelope, currentAccountId)
      handleIncomingMessage(envelope.payload.author_account_id)
    },
    [queryClient, currentAccountId, handleIncomingMessage],
  )

  useChatWsListeners(conversationId, {
    enabled: true,
    onMessageCreated,
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

      <MessageComposer
        conversationId={conversationId}
        currentAccountId={currentAccountId}
        canSend={conversation.can_send}
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
