import type { ReactNode } from 'react'

import { ContextPanel } from '#/shared/ui/ContextPanel'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import { CurrentOfferBlock } from './CurrentOfferBlock'
import { OffersArchiveBlock } from './OffersArchiveBlock'

interface ConversationOffersPanelProps {
  conversationId: string
  headerSlot?: ReactNode
}

export function ConversationOffersPanel({
  conversationId,
  headerSlot = null,
}: ConversationOffersPanelProps) {
  const {
    current,
    archiveItems,
    nextCursor,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversationOffersPaginated(conversationId)

  const meQuery = useMe()
  const actorKind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined

  return (
    <ContextPanel
      headerSlot={headerSlot}
      offerSlot={
        actorKind ? (
          <CurrentOfferBlock offer={current} actorKind={actorKind} />
        ) : null
      }
      archiveSlot={
        actorKind ? (
          <OffersArchiveBlock
            items={archiveItems}
            nextCursor={nextCursor}
            onLoadMore={fetchNextPage}
            isLoadingMore={isFetchingNextPage}
            actorKind={actorKind}
          />
        ) : null
      }
    />
  )
}
