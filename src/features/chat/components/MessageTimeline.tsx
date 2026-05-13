import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { GroupedVirtuoso } from 'react-virtuoso'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import type { MessageItem } from '#/features/chat/types'
import { trackChatEvent } from '#/features/chat/analytics/track'

import { groupByDayGrouped } from '../utils/groupByDay'

import { DaySeparator } from './DaySeparator'
import type { MarkAsPaidViewerRole } from '#/shared/payments/markAsPaidPermissions'
import {
  getPaymentMarkedDeclaredPaymentId,
  renderTimelineMessageContent,
} from './messageTimelineRenderers'
import {
  ConversationBeginningPill,
  EmptyMessageTimeline,
  PaymentHighlightFallback,
} from './messageTimelineChrome'

export interface MessageTimelineHandle {
  scrollToBottom: () => void
}

interface MessageTimelineProps {
  conversationId: string
  currentAccountId: string
  sessionKind: 'brand' | 'creator' | undefined
  viewerRole?: MarkAsPaidViewerRole
  onMarkAsPaid?: (deliverableId: string) => void
  onUploadDraft?: (deliverableId: string) => void
  onAtBottomStateChange?: (atBottom: boolean) => void
  timelineRef?: React.Ref<MessageTimelineHandle>
  highlightPaymentId?: string
}

// Large constant so prepending older messages can decrement firstItemIndex
// without going negative — Virtuoso uses this to anchor scroll position when
// new pages load at the top of the list.
const START_INDEX = 1_000_000

export function MessageTimeline({
  conversationId,
  currentAccountId,
  sessionKind,
  viewerRole,
  onMarkAsPaid,
  onUploadDraft,
  onAtBottomStateChange,
  timelineRef,
  highlightPaymentId,
}: MessageTimelineProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const hasScrolledToHighlightRef = useRef(false)

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

  const grouped = useMemo(() => groupByDayGrouped(allMessages), [allMessages])

  const firstItemIndex = START_INDEX - grouped.messages.length

  const hasReachedBeginning = !hasNextPage && (data?.pages.length ?? 0) > 0
  const highlightedTimelineIndex = useMemo(() => {
    if (!highlightPaymentId) return -1
    return grouped.messages.findIndex(
      (m) =>
        m.type === 'system_event' &&
        m.event_type === 'PaymentMarked' &&
        getPaymentMarkedDeclaredPaymentId(m.payload) === highlightPaymentId,
    )
  }, [highlightPaymentId, grouped.messages])
  const shouldShowHighlightFallback =
    Boolean(highlightPaymentId) &&
    (data?.pages.length ?? 0) > 0 &&
    highlightedTimelineIndex === -1

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

  useEffect(() => {
    hasScrolledToHighlightRef.current = false
  }, [highlightPaymentId])

  useEffect(() => {
    if (highlightedTimelineIndex < 0) return
    if (hasScrolledToHighlightRef.current) return

    virtuosoRef.current?.scrollToIndex({
      index: firstItemIndex + highlightedTimelineIndex,
      align: 'center',
      behavior: 'smooth',
    })
    hasScrolledToHighlightRef.current = true
  }, [firstItemIndex, highlightedTimelineIndex])

  const handleStartReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderItem = useCallback(
    (index: number, _groupIndex: number, message: MessageItem) => {
      const localIndex = index - firstItemIndex
      const prev = localIndex > 0 ? grouped.messages[localIndex - 1] : undefined
      const spacingClass = getTimelineSpacingClass(prev, message)

      const content = renderTimelineMessageContent({
        message,
        currentAccountId,
        conversationId,
        counterpartDisplayName:
          conversationDetail?.counterpart.display_name ?? '',
        highlightPaymentId,
        onMarkAsPaid,
        onUploadDraft,
        sessionKind,
        viewerRole,
      })
      if (content === null) return null

      return (
        <div data-message-id={message.id} className={`${spacingClass} px-4`}>
          {content}
        </div>
      )
    },
    [
      conversationDetail?.counterpart.display_name,
      conversationId,
      currentAccountId,
      firstItemIndex,
      grouped.messages,
      highlightPaymentId,
      onMarkAsPaid,
      onUploadDraft,
      sessionKind,
      viewerRole,
    ],
  )

  if (grouped.messages.length === 0) {
    return <EmptyMessageTimeline />
  }

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ minHeight: 0 }}
      data-testid="message-timeline"
    >
      {shouldShowHighlightFallback ? <PaymentHighlightFallback /> : null}
      <GroupedVirtuoso
        ref={virtuosoRef}
        key={conversationId}
        style={{ flex: 1, minHeight: 0 }}
        data={grouped.messages}
        groupCounts={grouped.groupCounts}
        groupContent={(index) => (
          <DaySeparator label={grouped.groups[index]?.label ?? ''} />
        )}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={Math.max(0, grouped.messages.length - 1)}
        startReached={handleStartReached}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        atBottomStateChange={onAtBottomStateChange}
        atBottomThreshold={0}
        itemContent={renderItem}
        components={{
          Header: () =>
            hasReachedBeginning ? <ConversationBeginningPill /> : null,
          Group: ({ children, ...props }) => (
            <div {...props} style={{ ...props.style, overflow: 'visible' }}>
              {children}
            </div>
          ),
        }}
      />
    </div>
  )
}

const SAME_BURST_MS = 30_000
const SAME_BLOCK_MS = 5 * 60_000

function getTimelineSpacingClass(
  prev: MessageItem | undefined,
  current: MessageItem,
): string {
  if (!prev) return ''

  const prevTime = new Date(prev.created_at).getTime()
  const currTime = new Date(current.created_at).getTime()
  if (Number.isNaN(prevTime) || Number.isNaN(currTime)) return 'mt-4'

  const delta = currTime - prevTime
  const sameAuthor =
    prev.author_account_id !== null &&
    prev.author_account_id === current.author_account_id

  if (delta <= SAME_BURST_MS && sameAuthor) return 'mt-0.5'
  if (delta <= SAME_BLOCK_MS) return 'mt-2'
  return 'mt-6'
}
