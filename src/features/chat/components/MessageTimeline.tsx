import { t } from '@lingui/core/macro'
import { useCallback, useMemo, useRef } from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import type { MessageItem } from '#/features/chat/types'

import type { TimelineItem } from '../utils/groupByDay'
import { groupByDay } from '../utils/groupByDay'

import { DaySeparator } from './DaySeparator'
import { MessageBubble } from './MessageBubble'

// react-virtuoso chosen over @tanstack/react-virtual: built-in reverse list mode,
// automatic scroll anchoring on prepend, and firstItemIndex shifting — all critical
// for chat history pagination. TanStack Virtual would require manual scroll-height
// compensation and sentinel management.

interface MessageTimelineProps {
  conversationId: string
  currentAccountId: string
}

const START_INDEX = 1_000_000

export function MessageTimeline({
  conversationId,
  currentAccountId,
}: MessageTimelineProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  const { data: conversationDetail } =
    useConversationDetailQuery(conversationId)

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessagesInfiniteQuery(conversationId)

  const allMessages = useMemo(() => {
    if (!data?.pages) return []
    const reversed: MessageItem[] = []
    for (let i = data.pages.length - 1; i >= 0; i--) {
      const page = data.pages[i]
      if (page?.data) {
        const pageMessages = [...page.data.data].reverse()
        reversed.push(...pageMessages)
      }
    }
    return reversed
  }, [data?.pages])

  const timelineItems = useMemo(() => groupByDay(allMessages), [allMessages])

  const firstItemIndex = useMemo(
    () => START_INDEX - timelineItems.length,
    [timelineItems.length],
  )

  const hasReachedBeginning = !hasNextPage && (data?.pages.length ?? 0) > 0

  const handleStartReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderItem = useCallback(
    (_index: number, item: TimelineItem) => {
      if (item.kind === 'day-separator') {
        return <DaySeparator label={item.label} />
      }

      const message = item.message
      if (message.type !== 'text' || !message.text_content) {
        return null
      }

      const isOwn = message.author_account_id === currentAccountId
      const direction = isOwn ? 'out' : 'in'
      const authorDisplayName = isOwn
        ? 'Tú'
        : (conversationDetail?.counterpart.display_name ?? '')

      return (
        <MessageBubble
          direction={direction}
          text={message.text_content}
          authorDisplayName={authorDisplayName}
          timestamp={message.created_at}
        />
      )
    },
    [currentAccountId, conversationDetail?.counterpart.display_name],
  )

  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t`No hay mensajes todavía`}
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative flex-1 overflow-hidden"
      data-testid="message-timeline"
    >
      <Virtuoso
        ref={virtuosoRef}
        data={timelineItems}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={timelineItems.length - 1}
        startReached={handleStartReached}
        followOutput="smooth"
        itemContent={renderItem}
        components={{
          Header: () =>
            hasReachedBeginning ? <ConversationBeginningPill /> : null,
        }}
      />
    </div>
  )
}

function ConversationBeginningPill() {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
        {t`Inicio de la conversación`}
      </span>
    </div>
  )
}
