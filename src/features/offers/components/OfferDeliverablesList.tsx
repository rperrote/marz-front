import { t } from '@lingui/core/macro'

import { DeliverableListItem } from '#/features/deliverables/components/DeliverableListItem'
import { ExpectedDeliverableSlot } from '#/features/deliverables/components/ExpectedDeliverableSlot'
import type { DeliverableDTO } from '#/features/deliverables/types'
import type { OfferDetailDTO } from '#/features/offers/types'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'

import type { ActorKind } from '../analytics'

type ExpectedDeliverableOfferStatus =
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'

interface OfferDeliverablesListProps {
  offer: OfferDetailDTO
  deliverables: DeliverableDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  actorKind: ActorKind
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

function toExpectedDeliverableOfferStatus(
  status: OfferDetailDTO['status'],
): ExpectedDeliverableOfferStatus {
  // ExpectedDeliverableSlot no conoce 'cancelled'; tratar como expired para mostrar el slot en estado final sin acción.
  return status === 'cancelled' ? 'expired' : status
}

function getHeaderLabel(offer: OfferDetailDTO): string {
  return offer.offer_mode === 'per_platform'
    ? t`Entregables por plataforma`
    : t`Entregables`
}

export function OfferDeliverablesList({
  offer,
  deliverables,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: OfferDeliverablesListProps) {
  const showExpectedSlot =
    deliverables.length === 0 && offer.deliverables.length > 0

  if (deliverables.length === 0 && !showExpectedSlot) return null

  const expectedFirst = offer.deliverables[0]

  return (
    <div className="mt-3 space-y-2">
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {getHeaderLabel(offer)}
      </div>
      <div className="space-y-2">
        {showExpectedSlot && expectedFirst ? (
          <ExpectedDeliverableSlot
            platform={expectedFirst.platform}
            format={expectedFirst.format}
            sessionKind={sessionKind}
            offerStatus={toExpectedDeliverableOfferStatus(offer.status)}
            onUploadDraft={
              expectedFirst.id
                ? () => onUploadDraft(expectedFirst.id as string)
                : undefined
            }
          />
        ) : (
          deliverables.map((deliverable) => (
            <DeliverableListItem
              key={deliverable.id}
              deliverable={deliverable}
              sessionKind={sessionKind}
              viewerRole={viewerRole}
              onUploadDraft={onUploadDraft}
              onMarkAsPaid={onMarkAsPaid}
              onSubmitLink={onSubmitLink}
            />
          ))
        )}
      </div>
    </div>
  )
}
