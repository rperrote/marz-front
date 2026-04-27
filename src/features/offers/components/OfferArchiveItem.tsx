import { t } from '@lingui/core/macro'
import { ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import type { ArchiveOfferItem } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/features/offers/utils/formatOffer'
import type { OfferStatus } from '#/features/offers/types'

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
  item: ArchiveOfferItem
}

export function OfferArchiveItem({ item }: OfferArchiveItemProps) {
  const badge = badgeConfig[item.status]
  const sentDate = new Date(item.sent_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
        aria-label={`${item.campaign_name} — ${formatOfferAmount(item.total_amount, item.currency)} — ${badge.label}`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] font-semibold text-foreground">
            #{item.id.slice(0, 8)}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {formatOfferAmount(item.total_amount, item.currency)} &middot;{' '}
            {sentDate}
          </div>
        </div>
        <Badge
          variant={badge.variant}
          className="shrink-0 rounded-full text-[11px]"
        >
          {badge.label}
        </Badge>
        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
