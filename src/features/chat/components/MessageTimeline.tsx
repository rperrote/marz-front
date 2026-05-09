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
import { StageOpenedBubble } from '#/features/offers/components/StageOpenedBubble'
import { stageOpenedSnapSchema } from '#/features/offers/schemas'
import { DraftSubmittedCard } from '#/features/deliverables/components/DraftSubmittedCard'
import { DraftApprovedCard } from '#/features/deliverables/components/DraftApprovedCard'
import { RequestChangesCard } from '#/features/deliverables/components/RequestChangesCard'
import { PaymentMarkedCard } from './systemEvents/PaymentMarkedCard'
import { LinkSubmittedCard } from '#/features/deliverables/components/LinkSubmittedCard'
import { LinkApprovedCard } from '#/features/deliverables/components/LinkApprovedCard'
import { LinkChangesRequestedCard } from '#/features/deliverables/components/LinkChangesRequestedCard'
import { getRecord, getString } from '#/shared/utils/record'

import { DaySeparator } from './DaySeparator'
import { EventBubble } from './EventBubble'
import type { EventSeverity } from './EventBubble'
import { MessageBubble } from './MessageBubble'
import type { MarkAsPaidViewerRole } from '#/shared/payments/markAsPaidPermissions'

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
  viewerRole?: MarkAsPaidViewerRole
  onMarkAsPaid?: (deliverableId: string) => void
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

  const timelineItems = useMemo(() => groupByDay(allMessages), [allMessages])

  const firstItemIndex = useMemo(
    () => START_INDEX - timelineItems.length,
    [timelineItems.length],
  )

  const hasReachedBeginning = !hasNextPage && (data?.pages.length ?? 0) > 0
  const highlightedTimelineIndex = useMemo(() => {
    if (!highlightPaymentId) return -1
    return timelineItems.findIndex(
      (item) =>
        item.kind === 'message' &&
        item.message.type === 'system_event' &&
        item.message.event_type === 'PaymentMarked' &&
        getPaymentMarkedDeclaredPaymentId(item.message.payload) ===
          highlightPaymentId,
    )
  }, [highlightPaymentId, timelineItems])
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
    (_index: number, item: TimelineItem) => {
      if (item.kind === 'day-separator') {
        return <DaySeparator label={item.label} />
      }

      const message = item.message

      if (message.type === 'system_event') {
        const deliverableEventType = parseDeliverableSystemEventType(
          message.event_type,
        )

        if (deliverableEventType) {
          const counterpartDisplayName =
            conversationDetail?.counterpart.display_name ?? ''

          switch (deliverableEventType) {
            case 'DraftSubmitted':
              return (
                <DraftSubmittedCard
                  message={message}
                  currentAccountId={currentAccountId}
                  counterpartDisplayName={counterpartDisplayName}
                  conversationId={conversationId}
                  sessionKind={sessionKind}
                />
              )
            case 'DraftApproved':
              return (
                <DraftApprovedCard
                  message={message}
                  currentAccountId={currentAccountId}
                  counterpartDisplayName={counterpartDisplayName}
                />
              )
            case 'ChangesRequested':
              return (
                <RequestChangesCard
                  message={message}
                  currentAccountId={currentAccountId}
                  counterpartDisplayName={counterpartDisplayName}
                  sessionKind={sessionKind}
                />
              )
            case 'LinkSubmitted':
              return (
                <LinkSubmittedCard
                  message={message}
                  currentAccountId={currentAccountId}
                  brandWorkspaceId={extractBrandWorkspaceId(message.payload)}
                  sessionKind={sessionKind}
                />
              )
            case 'LinkApproved':
              return (
                <LinkApprovedCard
                  message={message}
                  currentAccountId={currentAccountId}
                  conversationId={conversationId}
                  viewer={{ kind: sessionKind, role: viewerRole }}
                  onMarkAsPaid={onMarkAsPaid}
                />
              )
            case 'LinkChangesRequested':
              return (
                <LinkChangesRequestedCard
                  message={message}
                  currentAccountId={currentAccountId}
                  counterpartDisplayName={counterpartDisplayName}
                  sessionKind={sessionKind}
                />
              )
            default:
              return assertNever(deliverableEventType)
          }
        }

        if (message.event_type === 'PaymentMarked') {
          return (
            <PaymentMarkedCard
              message={message}
              viewer={{ kind: sessionKind }}
              highlighted={
                highlightPaymentId !== undefined &&
                getPaymentMarkedDeclaredPaymentId(message.payload) ===
                  highlightPaymentId
              }
            />
          )
        }

        if (message.event_type === 'StageOpened') {
          const rawPayload = message.payload ?? {}
          const snapshot =
            (rawPayload['snapshot'] as Record<string, unknown> | undefined) ??
            rawPayload
          const parsed = stageOpenedSnapSchema.safeParse(snapshot)
          if (!parsed.success) return null
          const side =
            message.author_account_id === currentAccountId ? 'out' : 'in'
          return (
            <div className="flex justify-center py-1">
              <StageOpenedBubble snapshot={parsed.data} side={side} />
            </div>
          )
        }

        if (message.event_type === 'StageApproved') {
          console.warn('StageApproved rendering not implemented yet (FEAT-009)')
          return null
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
      onMarkAsPaid,
      highlightPaymentId,
      sessionKind,
      viewerRole,
    ],
  )

  if (timelineItems.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        data-testid="message-timeline"
      >
        <p className="text-sm text-muted-foreground">
          {t`No hay mensajes todavía`}
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      style={{ minHeight: 0 }}
      data-testid="message-timeline"
    >
      {shouldShowHighlightFallback ? <PaymentHighlightFallback /> : null}
      <Virtuoso
        ref={virtuosoRef}
        key={conversationId}
        style={{ flex: 1, minHeight: 0 }}
        data={timelineItems}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={Math.max(0, timelineItems.length - 1)}
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

function getPaymentMarkedDeclaredPaymentId(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload) return null
  const snapshot =
    // RAFITA:ANY: payload es Record<string, unknown> — el snapshot no tiene tipo estático disponible en este contexto
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  const declaredPaymentId = snapshot.declared_payment_id
  return typeof declaredPaymentId === 'string' ? declaredPaymentId : null
}

function extractBrandWorkspaceId(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload) return null
  const snapshot = getRecord(payload.snapshot)
  return (
    getString(payload.brand_workspace_id) ??
    getString(snapshot?.brand_workspace_id)
  )
}

const DELIVERABLE_SYSTEM_EVENT_TYPES = [
  'DraftSubmitted',
  'DraftApproved',
  'ChangesRequested',
  'LinkSubmitted',
  'LinkApproved',
  'LinkChangesRequested',
] as const

type DeliverableSystemEventType =
  (typeof DELIVERABLE_SYSTEM_EVENT_TYPES)[number]

function parseDeliverableSystemEventType(
  eventType: string | null,
): DeliverableSystemEventType | null {
  const knownEventTypes: readonly string[] = DELIVERABLE_SYSTEM_EVENT_TYPES
  return eventType && knownEventTypes.includes(eventType)
    ? (eventType as DeliverableSystemEventType)
    : null
}

function assertNever(value: never): never {
  throw new Error(`Unhandled deliverable system event: ${String(value)}`)
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

function PaymentHighlightFallback() {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
        {t`Pago no visible en mensajes recientes`}
      </span>
    </div>
  )
}
