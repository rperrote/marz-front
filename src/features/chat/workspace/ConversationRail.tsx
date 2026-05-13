import { useCallback, useEffect, useRef } from 'react'
import { t } from '@lingui/core/macro'
import { PanelLeftOpen } from 'lucide-react'

import { CampaignFilterSelect } from './CampaignFilterSelect'
import { ConversationFilterTabs } from './ConversationFilterTabs'
import { ConversationRailEmpty } from './ConversationRailEmpty'
import { ConversationRailItem } from './ConversationRailItem'
import { ConversationSearchInput } from './ConversationSearchInput'
import { useConversationsQuery } from './useConversationsQuery'
import { useConversationRailStore } from './conversationRailStore'
import type {
  BrandWorkspaceSearch,
  CreatorWorkspaceSearch,
} from './workspaceSearchSchema'

interface ConversationRailProps {
  search: BrandWorkspaceSearch | CreatorWorkspaceSearch
  sessionKind?: 'brand' | 'creator'
  activeConversationId?: string
  variant?: 'full' | 'compact'
  onSelectConversation?: (conversationId: string) => void
}

export function ConversationRail({
  search,
  sessionKind,
  activeConversationId,
  variant = 'full',
  onSelectConversation,
}: ConversationRailProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useConversationsQuery({
    filter: search.filter,
    search: search.search,
    campaignId: 'campaign_id' in search ? search.campaign_id : undefined,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0,
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [handleIntersect])

  const openRail = useConversationRailStore((s) => s.open)
  const compact = variant === 'compact'
  const conversations = data?.pages.flatMap((page) => page.data.items) ?? []
  const hasResults = conversations.length > 0

  const expandButton = compact ? (
    <div className="flex w-14 shrink-0 justify-center py-2">
      <button
        type="button"
        onClick={openRail}
        aria-label={t`Expandir conversaciones`}
        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <PanelLeftOpen className="size-4" />
      </button>
    </div>
  ) : null

  const railHeader = compact ? null : (
    <div className="flex flex-col gap-2 border-b border-border p-3">
      <ConversationSearchInput
        key={search.search ?? ''}
        value={search.search}
        hasResults={hasResults}
      />
      <ConversationFilterTabs value={search.filter} />
      {sessionKind === 'brand' && 'campaign_id' in search ? (
        <CampaignFilterSelect value={search.campaign_id} />
      ) : null}
    </div>
  )

  if (isLoading) {
    return (
      <>
        {expandButton}
        {railHeader}
        <ConversationRailSkeleton />
      </>
    )
  }

  if (isError) {
    return (
      <>
        {expandButton}
        {railHeader}
        <div className="flex flex-col items-center gap-2 px-4 py-8">
          <p className="text-sm text-muted-foreground">
            {t`No se pudieron cargar las conversaciones`}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t`Reintentar`}
          </button>
        </div>
      </>
    )
  }

  if (conversations.length === 0) {
    const hasSearch = search.search !== undefined && search.search !== ''
    const hasActiveFilter =
      search.filter !== 'all' ||
      ('campaign_id' in search && search.campaign_id !== undefined)

    let emptyVariant:
      | 'no_conversations'
      | 'no_search_results'
      | 'no_filter_results'
    if (hasSearch) {
      emptyVariant = 'no_search_results'
    } else if (hasActiveFilter) {
      emptyVariant = 'no_filter_results'
    } else {
      emptyVariant = 'no_conversations'
    }

    return (
      <>
        {expandButton}
        {railHeader}
        <ConversationRailEmpty
          variant={emptyVariant}
          activeFilter={search.filter}
        />
      </>
    )
  }

  return (
    <>
      {expandButton}
      {railHeader}
      <div
        className={
          compact
            ? 'flex flex-col items-center gap-1.5 overflow-y-auto py-2'
            : 'flex flex-col overflow-y-auto'
        }
        role="list"
      >
        {conversations.map((conversation) => (
          <ConversationRailItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            variant={variant}
            onClick={onSelectConversation}
          />
        ))}
        <div ref={sentinelRef} className="h-px shrink-0" aria-hidden />
        {isFetchingNextPage ? <ConversationRailSkeleton count={2} /> : null}
      </div>
    </>
  )
}

const CONVERSATION_RAIL_SKELETON_ROWS = [
  'first',
  'second',
  'third',
  'fourth',
] as const

function ConversationRailSkeleton({ count = 4 }: { count?: 1 | 2 | 3 | 4 }) {
  const rows = CONVERSATION_RAIL_SKELETON_ROWS.slice(0, count)

  return (
    <div
      className="flex flex-col gap-1 p-2"
      role="status"
      aria-label={t`Cargando conversaciones`}
    >
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-3 px-3 py-2.5">
          <div className="size-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
