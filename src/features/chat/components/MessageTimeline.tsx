import { t } from '@lingui/core/macro'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import type { MessageItem } from '#/features/chat/types'
import { trackChatEvent } from '#/features/chat/analytics/track'

import { DEFAULT_TOLERANCE_PX } from '#/features/chat/hooks/useViewportAtBottom'
import type { TimelineItem } from '../utils/groupByDay'
import { groupByDay } from '../utils/groupByDay'

import { OFFER_EVENT_TYPES } from '#/shared/offers/constants'
import { OfferTimelineEntry } from '#/features/offers/components/OfferTimelineEntry'
import { DraftSubmittedCard } from '#/features/deliverables/components/DraftSubmittedCard'
import { DraftApprovedCard } from '#/features/deliverables/components/DraftApprovedCard'
import { RequestChangesCard } from '#/features/deliverables/components/RequestChangesCard'

import { DaySeparator } from './DaySeparator'
import { EventBubble } from './EventBubble'
import type { EventSeverity } from './EventBubble'
import { MessageBubble } from './MessageBubble'

// react-virtuoso chosen over @tanstack/react-virtual: built-in reverse list mode,
// automatic scroll anchoring on prepend, and firstItemIndex shifting — all critical
// for chat history pagination. TanStack Virtual would require manual scroll-height
// compensation and sentinel management.

export interface MessageTimelineHandle {
  scrollToBottom: () => void
}

interface MessageTimelineProps {
  conversationId: string
  currentAccountId: string
  sessionKind: 'brand' | 'creator' | undefined
  onAtBottomStateChange?: (atBottom: boolean) => void
  timelineRef?: React.Ref<MessageTimelineHandle>
}

const START_INDEX = 1_000_000

export function MessageTimeline({
  conversationId,
  currentAccountId,
  sessionKind,
  onAtBottomStateChange,
  timelineRef,
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

  const trackedPageCountRef = useRef(0)

  useEffect(() => {
    const pageCount = data?.pages.length ?? 0
    if (pageCount <= trackedPageCountRef.current) return
    const newPageIndex = pageCount - 1
    const latestPage = data?.pages[newPageIndex]
    trackedPageCountRef.current = pageCount
    if (newPageIndex > 0 && latestPage) {
      trackChatEvent('history_page_loaded', {
        conversation_id: conversationId,
        page_index: newPageIndex,
        items_count: latestPage.data.data.length,
      })
    }
  }, [data?.pages, conversationId])

  useImperativeHandle(timelineRef, () => ({
    scrollToBottom: () => {
      virtuosoRef.current?.scrollToIndex({
        index: 'LAST',
        behavior: 'smooth',
      })
    },
  }))

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

      if (message.type === 'system_event') {
        if (message.event_type === 'DraftSubmitted') {
          return (
            <DraftSubmittedCard
              message={message}
              currentAccountId={currentAccountId}
              counterpartDisplayName={
                conversationDetail?.counterpart.display_name ?? ''
              }
              conversationId={conversationId}
              sessionKind={sessionKind}
            />
          )
        }

        if (message.event_type === 'DraftApproved') {
          return (
            <DraftApprovedCard
              message={message}
              currentAccountId={currentAccountId}
              counterpartDisplayName={
                conversationDetail?.counterpart.display_name ?? ''
              }
            />
          )
        }

        if (message.event_type === 'ChangesRequested') {
          return (
            <RequestChangesCard
              message={message}
              currentAccountId={currentAccountId}
              counterpartDisplayName={
                conversationDetail?.counterpart.display_name ?? ''
              }
            />
          )
        }

        if (OFFER_EVENT_TYPES.has(message.event_type ?? '')) {
          return (
            <OfferTimelineEntry
              message={message}
              currentAccountId={currentAccountId}
              counterpartDisplayName={
                conversationDetail?.counterpart.display_name ?? ''
              }
            />
          )
        }

        const label =
          (message.payload?.['display_text'] as string | undefined) ??
          message.event_type ??
          t`Evento del sistema`
        return (
          <div className="flex justify-center py-1">
            <EventBubble
              severity={resolveEventSeverity(message.event_type)}
              direction="out"
            >
              {label}
            </EventBubble>
          </div>
        )
      }

      if (!message.text_content) {
        return null
      }

      const isOwn = message.author_account_id === currentAccountId
      const direction = isOwn ? 'out' : 'in'
      const authorDisplayName = isOwn
        ? t`Tú`
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
    [
      currentAccountId,
      conversationDetail?.counterpart.display_name,
      conversationId,
      sessionKind,
    ],
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
    <div className="flex-1 overflow-hidden" data-testid="message-timeline">
      <Virtuoso
        ref={virtuosoRef}
        data={timelineItems}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={timelineItems.length - 1}
        startReached={handleStartReached}
        followOutput="smooth"
        atBottomStateChange={onAtBottomStateChange}
        atBottomThreshold={DEFAULT_TOLERANCE_PX}
        itemContent={renderItem}
        components={{
          Header: () =>
            hasReachedBeginning ? <ConversationBeginningPill /> : null,
        }}
      />
    </div>
  )
}

const EVENT_SEVERITY_MAP: Record<string, EventSeverity> = {
  offer_accepted: 'success',
  offer_completed: 'success',
  deliverable_approved: 'success',
  payment_released: 'success',
  offer_rejected: 'destructive',
  offer_cancelled: 'destructive',
  deliverable_rejected: 'destructive',
  offer_sent: 'info',
  deliverable_submitted: 'info',
  offer_expired: 'warning',
  revision_requested: 'warning',
}

function resolveEventSeverity(eventType: string | null): EventSeverity {
  if (!eventType) return 'info'
  return EVENT_SEVERITY_MAP[eventType] ?? 'info'
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
