import { useEffect, useRef } from 'react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import type { ConversationOfferDTO } from '#/features/offers/hooks/useConversationOffers'
import {
  formatOfferAmount,
  formatOfferDeadline,
  formatOfferPlatform,
} from '#/features/offers/utils/formatOffer'
import type { OfferStatus } from '#/features/offers/types'
import { trackOfferEvent } from '../analytics'
import type { ActorKind } from '../analytics'
import { MultiStageStagesList } from './MultiStageStagesList'

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

interface CurrentOfferBlockProps {
  offer: ConversationOfferDTO | null
  actorKind: ActorKind
}

function OfferTypeContent({ offer }: { offer: ConversationOfferDTO }) {
  if (offer.type === 'multistage') {
    return (
      <MultiStageStagesList
        stages={offer.stages}
        offerStatus={offer.status}
        currency={offer.currency}
      />
    )
  }

  if (offer.type === 'bundle') {
    return (
      <div className="mt-3 space-y-2">
        <div className="mb-1.5 font-mono text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
          {t`Deliverables`}
        </div>
        {offer.deliverables.map((d, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-4 text-xs"
          >
            <span className="text-foreground">
              {formatOfferPlatform(d.platform, d.format)} × {d.quantity}
            </span>
            <span className="font-mono text-foreground">
              {formatOfferAmount(d.amount, offer.currency)}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2 text-xs font-semibold">
          <span className="text-foreground">{t`Total`}</span>
          <span className="font-mono text-foreground">
            {formatOfferAmount(offer.total_amount, offer.currency)}
          </span>
        </div>
      </div>
    )
  }

  const deliverable = offer.deliverables[0]
  if (!deliverable) return null

  return (
    <div className="mt-3">
      <div className="mb-1.5 font-mono text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
        {t`Deliverables`}
      </div>
      <div className="text-xs text-foreground">
        {formatOfferPlatform(deliverable.platform, deliverable.format)}
      </div>
    </div>
  )
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

  const badge = statusConfig[offer.status]

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
        {offer.speed_bonus ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Speed bonus`}</dt>
            <dd className="font-mono text-xs font-medium text-success">
              +
              {formatOfferAmount(
                offer.speed_bonus.bonus_amount,
                offer.speed_bonus.currency,
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      <OfferTypeContent offer={offer} />
    </div>
  )
}
