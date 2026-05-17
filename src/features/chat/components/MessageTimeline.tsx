import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import type { MessageItem } from '#/features/chat/types'
import { trackChatEvent } from '#/features/chat/analytics/track'
import type { MarkAsPaidViewerRole } from '#/shared/payments/markAsPaidPermissions'

import { groupByDayGrouped } from '../utils/groupByDay'
import { DaySeparator } from './DaySeparator'
import {
  getPaymentMarkedDeclaredPaymentId,
  TimelineMessageContent,
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

type Row =
  | { kind: 'separator'; id: string; label: string }
  | {
      kind: 'message'
      id: string
      message: MessageItem
      prev: MessageItem | undefined
    }

const AT_BOTTOM_THRESHOLD = 80
const ESTIMATE_SIZE = 80
const SAME_BURST_MS = 30_000
const SAME_BLOCK_MS = 5 * 60_000

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
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wasAtBottomRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const prevFirstMessageIdRef = useRef<string | null>(null)
  const lastNotifiedAtBottomRef = useRef(true)

  const { data: conversationDetail } =
    useConversationDetailQuery(conversationId)

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessagesInfiniteQuery(conversationId)

  const allMessages = useMemo(() => {
    if (!data?.pages) return [] as MessageItem[]
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

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    let cursor = 0
    for (let g = 0; g < grouped.groups.length; g++) {
      const group = grouped.groups[g]!
      const count = grouped.groupCounts[g] ?? 0
      out.push({
        kind: 'separator',
        id: `sep:${group.date}`,
        label: group.label,
      })
      for (let i = 0; i < count; i++) {
        const msg = grouped.messages[cursor]
        if (!msg) {
          cursor++
          continue
        }
        const prev = cursor > 0 ? grouped.messages[cursor - 1] : undefined
        out.push({
          kind: 'message',
          id: `msg:${msg.id}`,
          message: msg,
          prev,
        })
        cursor++
      }
    }
    return out
  }, [grouped])

  const highlightedRowIndex = useMemo(() => {
    if (!highlightPaymentId) return -1
    return rows.findIndex(
      (r) =>
        r.kind === 'message' &&
        r.message.type === 'system_event' &&
        r.message.event_type === 'PaymentMarked' &&
        getPaymentMarkedDeclaredPaymentId(r.message.payload) ===
          highlightPaymentId,
    )
  }, [highlightPaymentId, rows])

  const shouldShowHighlightFallback =
    Boolean(highlightPaymentId) &&
    (data?.pages.length ?? 0) > 0 &&
    highlightedRowIndex === -1

  const hasReachedBeginning = !hasNextPage && (data?.pages.length ?? 0) > 0

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: 8,
    getItemKey: (i) => rows[i]?.id ?? i,
  })

  const totalSize = virtualizer.getTotalSize()

  const checkAtBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance <= AT_BOTTOM_THRESHOLD
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useImperativeHandle(timelineRef, () => ({
    scrollToBottom: () => scrollToBottom('smooth'),
  }))

  // Initial mount: jump to bottom instantly once we have rows.
  const initialAnchoredRef = useRef(false)
  useLayoutEffect(() => {
    if (initialAnchoredRef.current) return
    if (rows.length === 0) return
    initialAnchoredRef.current = true
    // Two passes: first sync, then after items measured.
    scrollToBottom('auto')
    requestAnimationFrame(() => scrollToBottom('auto'))
    const t1 = setTimeout(() => scrollToBottom('auto'), 100)
    const t2 = setTimeout(() => scrollToBottom('auto'), 350)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [rows.length, scrollToBottom])

  // Preserve scroll anchor when prepending older messages.
  const firstMessageId =
    grouped.messages.length > 0 ? grouped.messages[0]!.id : null
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const prevFirst = prevFirstMessageIdRef.current
    if (prevFirst && firstMessageId && prevFirst !== firstMessageId) {
      const newScrollHeight = el.scrollHeight
      const delta = newScrollHeight - prevScrollHeightRef.current
      if (delta > 0) {
        el.scrollTop = el.scrollTop + delta
      }
    }
    prevFirstMessageIdRef.current = firstMessageId
    prevScrollHeightRef.current = el.scrollHeight
  }, [firstMessageId, totalSize])

  // Stick-to-bottom when new messages arrive at the tail and user was at bottom.
  const prevLastMessageIdRef = useRef<string | null>(null)
  const lastMessageId =
    grouped.messages.length > 0
      ? grouped.messages[grouped.messages.length - 1]!.id
      : null
  useLayoutEffect(() => {
    const prev = prevLastMessageIdRef.current
    prevLastMessageIdRef.current = lastMessageId
    if (!prev) return
    if (lastMessageId === prev) return
    if (wasAtBottomRef.current) {
      const el = scrollRef.current
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        })
      }
    }
  }, [lastMessageId])

  // Track at-bottom + notify parent.
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = checkAtBottom()
    wasAtBottomRef.current = atBottom
    if (atBottom !== lastNotifiedAtBottomRef.current) {
      lastNotifiedAtBottomRef.current = atBottom
      onAtBottomStateChange?.(atBottom)
    }
    // Reverse infinite: trigger when near top.
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [
    checkAtBottom,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onAtBottomStateChange,
  ])

  // Track page count for analytics (parity with v1).
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

  // Scroll to highlight.
  const hasScrolledToHighlightRef = useRef(false)
  useEffect(() => {
    hasScrolledToHighlightRef.current = false
  }, [highlightPaymentId])
  useEffect(() => {
    if (highlightedRowIndex < 0) return
    if (hasScrolledToHighlightRef.current) return
    virtualizer.scrollToIndex(highlightedRowIndex, {
      align: 'center',
      behavior: 'smooth',
    })
    hasScrolledToHighlightRef.current = true
  }, [highlightedRowIndex, virtualizer])

  if (rows.length === 0) {
    return <EmptyMessageTimeline />
  }

  const items = virtualizer.getVirtualItems()
  const counterpartDisplayName =
    conversationDetail?.counterpart.display_name ?? ''

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ minHeight: 0 }}
      data-testid="message-timeline"
      data-loaded-message-count={allMessages.length}
      data-has-reached-beginning={hasReachedBeginning ? 'true' : 'false'}
    >
      {shouldShowHighlightFallback ? <PaymentHighlightFallback /> : null}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
        data-testid="message-timeline-scroller"
      >
        {hasReachedBeginning ? <ConversationBeginningPill /> : null}
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((vi) => {
            const row = rows[vi.index]
            if (!row) return null
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {row.kind === 'separator' ? (
                  <DaySeparator label={row.label} />
                ) : (
                  <MessageRow
                    row={row}
                    currentAccountId={currentAccountId}
                    conversationId={conversationId}
                    counterpartDisplayName={counterpartDisplayName}
                    highlightPaymentId={highlightPaymentId}
                    onMarkAsPaid={onMarkAsPaid}
                    onUploadDraft={onUploadDraft}
                    sessionKind={sessionKind}
                    viewerRole={viewerRole}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-4" aria-hidden />
      </div>
    </div>
  )
}

function getTimelineSpacingClass(
  prev: MessageItem | undefined,
  current: MessageItem,
): string {
  if (!prev) return ''
  const prevTime = new Date(prev.created_at).getTime()
  const currTime = new Date(current.created_at).getTime()
  /* eslint-disable lingui/no-unlocalized-strings -- Tailwind spacing classes are not translatable UI copy. */
  if (Number.isNaN(prevTime) || Number.isNaN(currTime)) return 'mt-4'
  const delta = currTime - prevTime
  const sameAuthor =
    prev.author_account_id !== null &&
    prev.author_account_id === current.author_account_id
  if (delta <= SAME_BURST_MS && sameAuthor) return 'mt-0.5'
  if (delta <= SAME_BLOCK_MS) return 'mt-2'
  return 'mt-6'
  /* eslint-enable lingui/no-unlocalized-strings */
}

interface MessageRowProps {
  row: Extract<Row, { kind: 'message' }>
  currentAccountId: string
  conversationId: string
  counterpartDisplayName: string
  highlightPaymentId: string | undefined
  onMarkAsPaid: ((deliverableId: string) => void) | undefined
  onUploadDraft: ((deliverableId: string) => void) | undefined
  sessionKind: 'brand' | 'creator' | undefined
  viewerRole: MarkAsPaidViewerRole | undefined
}

function MessageRow({
  row,
  currentAccountId,
  conversationId,
  counterpartDisplayName,
  highlightPaymentId,
  onMarkAsPaid,
  onUploadDraft,
  sessionKind,
  viewerRole,
}: MessageRowProps) {
  return (
    <div
      data-message-id={row.message.id}
      className={`${getTimelineSpacingClass(row.prev, row.message)} px-4`}
    >
      <TimelineMessageContent
        message={row.message}
        currentAccountId={currentAccountId}
        conversationId={conversationId}
        counterpartDisplayName={counterpartDisplayName}
        highlightPaymentId={highlightPaymentId}
        onMarkAsPaid={onMarkAsPaid}
        onUploadDraft={onUploadDraft}
        sessionKind={sessionKind}
        viewerRole={viewerRole}
      />
    </div>
  )
}
