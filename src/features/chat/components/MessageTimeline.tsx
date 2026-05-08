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
import { LinkSubmittedCard } from '#/features/deliverables/components/LinkSubmittedCard'
import type { PublishedLinkPreview } from '#/features/deliverables/types'

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

// Large constant so prepending older messages can decrement firstItemIndex
// without going negative — Virtuoso uses this to anchor scroll position when
// new pages load at the top of the list.
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
              sessionKind={sessionKind}
            />
          )
        }

        if (message.event_type === 'LinkSubmitted') {
          const snapshot = parseLinkSubmittedSnapshot(message.payload)
          if (!snapshot) return null
          if (sessionKind === 'brand') {
            return (
              <LinkSubmittedCard
                audience="brand"
                message={snapshot.message}
                url={snapshot.url}
                platform={snapshot.platform}
                preview={snapshot.preview}
                payoutAmount={snapshot.payoutAmount}
              />
            )
          }
          return (
            <LinkSubmittedCard
              audience="creator"
              message={snapshot.message}
              url={snapshot.url}
              platform={snapshot.platform}
              preview={snapshot.preview}
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
      sessionKind,
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
      className="flex-1 overflow-hidden"
      style={{ minHeight: 0 }}
      data-testid="message-timeline"
    >
      <Virtuoso
        ref={virtuosoRef}
        key={conversationId}
        style={{ height: '100%' }}
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

function parseLinkSubmittedSnapshot(payload: Record<string, unknown> | null): {
  message: string
  url: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
  preview: PublishedLinkPreview | null
  payoutAmount: string
} | null {
  const root = payload ?? {}
  const snapshot = getRecord(root['snapshot']) ?? root
  const link = getRecord(snapshot['link']) ?? snapshot
  const url = getString(link['url']) ?? getString(snapshot['url'])
  if (!url) return null

  return {
    message:
      getString(snapshot['message']) ??
      getString(root['message']) ??
      t`Just published! Sharing the link here.`,
    url,
    platform: parseLinkPlatform(
      getString(link['platform']) ?? getString(snapshot['platform']),
    ),
    preview:
      parseLinkPreview(link['preview']) ??
      parseLinkPreview(snapshot['preview']),
    payoutAmount:
      getString(snapshot['payout_amount_formatted']) ??
      getString(root['payout_amount_formatted']) ??
      '$0.00',
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function parseLinkPlatform(
  value: string | null,
): 'youtube' | 'instagram' | 'tiktok' | 'twitter_x' {
  if (
    value === 'youtube' ||
    value === 'instagram' ||
    value === 'tiktok' ||
    value === 'twitter_x'
  ) {
    return value
  }
  return 'youtube'
}

function parseLinkPreview(value: unknown): PublishedLinkPreview | null {
  const preview = getRecord(value)
  const outcome = getString(preview?.['outcome'])

  if (outcome === 'url_only' || outcome === 'failed') {
    return { outcome }
  }

  if (outcome !== 'title_and_thumbnail') {
    return null
  }

  const title = getString(preview?.['title'])
  const thumbnailUrl = getString(preview?.['thumbnail_url'])
  if (!title || !thumbnailUrl) return null

  return {
    outcome: 'title_and_thumbnail',
    title,
    thumbnail_url: thumbnailUrl,
  }
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
