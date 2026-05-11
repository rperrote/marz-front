import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { ContextPanel } from '#/shared/ui/ContextPanel'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import { CurrentOfferBlock } from './CurrentOfferBlock'
import { OffersArchiveBlock } from './OffersArchiveBlock'

interface ConversationOffersPanelProps {
  conversationId: string
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
  headerSlot?: ReactNode
}

export function ConversationOffersPanel({
  conversationId,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
  headerSlot = null,
}: ConversationOffersPanelProps) {
  const {
    current,
    archiveItems,
    nextCursor,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversationOffersPaginated(conversationId)

  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)

  const meQuery = useMe()
  const actorKind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined

  const deliverables = deliverablesQuery.data?.deliverables ?? []
  const stages = deliverablesQuery.data?.stages ?? []

  return (
    <ContextPanel
      headerSlot={headerSlot}
      offerSlot={
        actorKind ? (
          <CurrentOfferBlock
            offer={current}
            actorKind={actorKind}
            deliverables={deliverables}
            stages={stages}
            sessionKind={sessionKind}
            viewerRole={viewerRole}
            onUploadDraft={onUploadDraft}
            onMarkAsPaid={onMarkAsPaid}
            onSubmitLink={onSubmitLink}
          />
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
      errorSlot={
        deliverablesQuery.isError ? (
          <p className="px-1 text-xs text-muted-foreground">
            {t`Error loading deliverables`}
          </p>
        ) : null
      }
    />
  )
}
