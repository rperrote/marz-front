import { useEffect, useRef } from 'react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import type { ConversationOfferDTO } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { formatOfferDeadline } from '#/features/offers/utils/formatOffer'
import type { OfferStatus } from '#/features/offers/types'
import type { DeliverableDTO, StageDTO } from '#/features/deliverables/types'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import { trackOfferEvent } from '../analytics'
import type { ActorKind } from '../analytics'
import { OfferDeliverablesList } from './OfferDeliverablesList'
import { formatBonusWindowsLabel } from '../utils/bonusTerms'

const statusConfig: Record<
  OfferStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  sent: { label: t`Sent`, variant: 'secondary' },
  accepted: { label: t`Accepted`, variant: 'default' },
  rejected: { label: t`Rejected`, variant: 'destructive' },
  expired: { label: t`Expired`, variant: 'outline' },
}

function getPaymentProgress(offer: ConversationOfferDTO) {
  const deliverables = offer.deliverables
  const total = deliverables.length
  const paidCount = deliverables.filter((d) => d.status === 'paid').length

  return { paidCount, total }
}

function getOfferBadge(offer: ConversationOfferDTO) {
  const progress = getPaymentProgress(offer)
  if (progress.total > 0 && progress.paidCount === progress.total) {
    return { label: t`Fully paid`, variant: 'default' as const }
  }

  if (progress.paidCount > 0 && progress.paidCount < progress.total) {
    return {
      label: t`Partially paid (${progress.paidCount}/${progress.total})`,
      variant: 'secondary' as const,
    }
  }

  return statusConfig[offer.status]
}

interface CurrentOfferBlockProps {
  offer: ConversationOfferDTO | null
  actorKind: ActorKind
  deliverables: DeliverableDTO[]
  stages: StageDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-center text-sm text-muted-foreground">
        {t`No active offer`}
      </p>
    </div>
  )
}

export function CurrentOfferBlock({
  offer,
  actorKind,
  deliverables,
  stages,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: CurrentOfferBlockProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (offer && !trackedRef.current) {
      trackedRef.current = true
      trackOfferEvent('offer_panel_viewed', {
        actor_kind: actorKind,
        offer_state: offer.status,
      })
    }
  }, [offer, actorKind])

  if (!offer) {
    return <EmptyState />
  }

  const badge = getOfferBadge(offer)
  const bonusLabel = formatBonusWindowsLabel(offer.bonus_terms)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {t`Current Offer`}
          </span>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            #{offer.id.slice(0, 8)}
          </span>
        </div>
        <Badge
          variant={badge.variant}
          className="shrink-0 rounded-full text-[11px]"
        >
          {badge.label}
        </Badge>
      </header>

      <dl className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">{t`Budget`}</dt>
          <dd className="font-mono text-xs font-semibold text-foreground">
            {formatOfferAmount(offer.total_amount, offer.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">{t`Deadline`}</dt>
          <dd className="text-xs font-medium text-foreground">
            {formatOfferDeadline(offer.deadline)}
          </dd>
        </div>
        {bonusLabel ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Speed bonus`}</dt>
            <dd className="font-mono text-xs font-medium text-success">
              {bonusLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      <OfferDeliverablesList
        offer={offer}
        deliverables={deliverables}
        stages={stages}
        sessionKind={sessionKind}
        viewerRole={viewerRole}
        actorKind={actorKind}
        onUploadDraft={onUploadDraft}
        onMarkAsPaid={onMarkAsPaid}
        onSubmitLink={onSubmitLink}
      />
    </div>
  )
}
