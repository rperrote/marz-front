import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import { useChatWsListeners } from '#/features/chat/ws/useChatWsListeners'
import { handleMessageCreated } from '#/features/chat/ws/messageCreatedHandler'

import { ConversationHeader } from './ConversationHeader'
import { EmptyConversationFallback } from './EmptyConversationFallback'
import { MessageTimeline } from './MessageTimeline'
import { MessageComposer } from './MessageComposer'

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

  useMessagesInfiniteQuery(conversationId)

  const onMessageCreated = useCallback(
    (envelope: Parameters<typeof handleMessageCreated>[1]) => {
      handleMessageCreated(queryClient, envelope, currentAccountId)
    },
    [queryClient, currentAccountId],
  )

  useChatWsListeners(conversationId, {
    enabled: true,
    onMessageCreated,
  })

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

      <MessageTimeline
        conversationId={conversationId}
        currentAccountId={currentAccountId}
      />

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
