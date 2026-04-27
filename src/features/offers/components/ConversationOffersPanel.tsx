import type { ReactNode } from 'react'

import { ContextPanel } from '#/shared/ui/ContextPanel'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
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

  return (
    <ContextPanel
      headerSlot={headerSlot}
      offerSlot={<CurrentOfferBlock offer={current} />}
      archiveSlot={
        <OffersArchiveBlock
          items={archiveItems}
          nextCursor={nextCursor}
          onLoadMore={fetchNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      }
    />
  )
}
