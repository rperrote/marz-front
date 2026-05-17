import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { ContextPanel } from '#/shared/ui/ContextPanel'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import type { MarkAsPaidOffer } from '#/shared/payments/markAsPaidEligibility'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'
import { CurrentOfferBlock } from './CurrentOfferBlock'
import { NextStep } from './NextStep'
import { OffersArchiveBlock } from './OffersArchiveBlock'

interface ConversationOffersPanelProps {
  conversationId: string
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (offer: MarkAsPaidOffer) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
  headerSlot?: ReactNode
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

export function ConversationOffersPanel({
  conversationId,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
  headerSlot = null,
  canSendOffer,
  onSendOffer,
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

  return (
    <ContextPanel
      headerSlot={headerSlot}
      nextStepSlot={
        <NextStep
          offer={current}
          sessionKind={sessionKind}
          deliverables={deliverables}
        />
      }
      offerSlot={
        actorKind ? (
          <CurrentOfferBlock
            offer={current}
            actorKind={actorKind}
            conversationId={conversationId}
            deliverables={deliverables}
            sessionKind={sessionKind}
            viewerRole={viewerRole}
            onUploadDraft={onUploadDraft}
            onMarkAsPaid={onMarkAsPaid}
            onSubmitLink={onSubmitLink}
            canSendOffer={canSendOffer}
            onSendOffer={onSendOffer}
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
            defaultOpen={!current}
          />
        ) : null
      }
      errorSlot={
        deliverablesQuery.isError ? (
          <p className="px-1 text-xs text-muted-foreground">
            {t`Error al cargar entregables`}
          </p>
        ) : null
      }
    />
  )
}
