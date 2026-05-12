import { t } from '@lingui/core/macro'
import { ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import type { ArchivedOfferItem } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import type { OfferStatus } from '#/features/offers/types'
import { getOfferTypeBadgeLabel, OfferTypeBadge } from './OfferTypeBadge'

const badgeConfig: Record<
  OfferStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  sent: { label: t`Pending`, variant: 'secondary' },
  accepted: { label: t`Accepted`, variant: 'default' },
  rejected: { label: t`Rejected`, variant: 'destructive' },
  expired: { label: t`Expired`, variant: 'outline' },
}

interface OfferArchiveItemProps {
  item: ArchivedOfferItem
}

export function OfferArchiveItem({ item }: OfferArchiveItemProps) {
  const offer = item.offer
  const badge = badgeConfig[offer.status]
  const offerTypeLabel = getOfferTypeBadgeLabel(item.type)
  // RAFITA:BLOCKER currency no expuesto en OfferDTO — asumir USD hasta que backend lo agregue
  const currency = 'USD'
  // RAFITA:BLOCKER campaign_name no expuesto en OfferDTO — usar id corto hasta que backend lo agregue
  const campaignLabel = offer.campaign_id.slice(0, 8)
  const sentAt = offer.sent_at ?? offer.created_at
  const sentDate = new Date(sentAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
        aria-label={`${campaignLabel} — ${formatOfferAmount(offer.amount, currency)} — ${offerTypeLabel} — ${badge.label}`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] font-semibold text-foreground">
            #{offer.id.slice(0, 8)}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {formatOfferAmount(offer.amount, currency)} &middot; {sentDate}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <OfferTypeBadge type={item.type} />
          <Badge
            variant={badge.variant}
            className="shrink-0 rounded-full text-[11px]"
          >
            {badge.label}
          </Badge>
        </div>
        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
