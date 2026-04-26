import { useCallback, useEffect, useRef } from 'react'
import { t } from '@lingui/core/macro'

import { ConversationFilterTabs } from './ConversationFilterTabs'
import { ConversationRailItem } from './ConversationRailItem'
import { ConversationSearchInput } from './ConversationSearchInput'
import { useConversationsQuery } from './useConversationsQuery'
import type { BrandWorkspaceSearch } from './workspaceSearchSchema'

interface ConversationRailProps {
  search: BrandWorkspaceSearch
  activeConversationId?: string
  onSelectConversation?: (conversationId: string) => void
  emptySlot?: React.ReactNode
}

export function ConversationRail({
  search,
  activeConversationId,
  onSelectConversation,
  emptySlot,
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
    campaignId: search.campaign_id,
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

  const railHeader = (
    <div className="flex flex-col gap-2 border-b border-border p-3">
      <ConversationSearchInput value={search.search} />
      <ConversationFilterTabs value={search.filter} />
    </div>
  )

  if (isLoading) {
    return (
      <>
        {railHeader}
        <ConversationRailSkeleton />
      </>
    )
  }

  if (isError) {
    return (
      <>
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

  const conversations = data?.pages.flatMap((page) => page.data.data) ?? []

  if (conversations.length === 0) {
    return (
      <>
        {railHeader}
        {emptySlot}
      </>
    )
  }

  return (
    <>
      {railHeader}
      <div className="flex flex-col overflow-y-auto" role="list">
        {conversations.map((conversation) => (
          <ConversationRailItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            onClick={onSelectConversation}
          />
        ))}
        <div ref={sentinelRef} className="h-px shrink-0" aria-hidden />
        {isFetchingNextPage ? <ConversationRailSkeleton count={2} /> : null}
      </div>
    </>
  )
}

function ConversationRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex flex-col gap-1 p-2"
      role="status"
      aria-label={t`Cargando conversaciones`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
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
