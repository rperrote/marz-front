import { Timer, Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { SystemEventCard, StatTile } from '#/shared/ui/SystemEventCard'
import type { OfferSnapshot, OfferStatus } from '../types'
import {
  formatOfferAmount,
  formatOfferDeadline,
  formatOfferPlatform,
} from '../utils/formatOffer'

interface OfferCardSentProps {
  snapshot: OfferSnapshot
  status: OfferStatus
}

function getStatusConfig(): Record<
  OfferStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> {
  return {
    sent: { label: t`Awaiting response`, variant: 'secondary' },
    accepted: { label: t`Accepted`, variant: 'default' },
    rejected: { label: t`Rejected`, variant: 'destructive' },
    expired: { label: t`Expired`, variant: 'outline' },
  }
}

export function OfferCardSent({ snapshot, status }: OfferCardSentProps) {
  const badge = getStatusConfig()[status]
  const amount = formatOfferAmount(snapshot.total_amount, snapshot.currency)
  const deadline = formatOfferDeadline(snapshot.deadline)
  const platform = formatOfferPlatform(snapshot.platform, snapshot.format)

  return (
    <div
      role="article"
      aria-label={t`Offer sent, total ${amount}, deadline ${deadline}`}
    >
      <SystemEventCard tone="success" kicker={t`Offer sent`} icon={Timer}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {snapshot.campaign_name}
          </h3>

          <div className="flex gap-3">
            <StatTile label={t`Budget`} value={amount} />
            <StatTile label={t`Deadline`} value={deadline} />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
              <Sparkles className="size-4" />
              {platform}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Timer className="size-4" />
            {status === 'sent' ? (
              <span>{badge.label}</span>
            ) : (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            )}
          </div>
        </div>
      </SystemEventCard>
    </div>
  )
}
