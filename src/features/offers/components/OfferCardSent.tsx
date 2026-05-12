import { Timer, Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import type { OfferSnapshot, OfferStatus } from '../types'
import { formatOfferDeadline, formatOfferPlatform } from '../utils/formatOffer'

interface OfferCardSentProps {
  snapshot: OfferSnapshot
  status: OfferStatus
}

function getStatusLabel(status: OfferStatus): string {
  switch (status) {
    case 'sent':
      return t`Awaiting response`
    case 'accepted':
      return t`Accepted`
    case 'rejected':
      return t`Rejected`
    case 'expired':
      return t`Expired`
  }
}

export function OfferCardSent({ snapshot, status }: OfferCardSentProps) {
  const amount = formatOfferAmount(snapshot.total_amount, snapshot.currency)
  const deadline = formatOfferDeadline(snapshot.deadline)
  const platform = formatOfferPlatform(snapshot.platform, snapshot.format)
  const statusLabel = getStatusLabel(status)

  return (
    <div className="flex justify-end">
      <div
        role="article"
        aria-label={t`Offer sent, total ${amount}, deadline ${deadline}`}
        className="w-full max-w-[460px] overflow-hidden rounded-xl border-2 border-primary bg-card"
      >
        <div className="flex items-center gap-2 border-b border-primary/40 bg-accent px-4 py-2.5">
          <Timer className="size-3 text-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            {t`Offer sent`}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            {snapshot.campaign_name}
          </h3>

          <div className="flex gap-3">
            <StatTile label={t`Budget`} value={amount} />
            <StatTile label={t`Deadline`} value={deadline} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <PlatformPill label={platform} />
          </div>

          <div className="flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
            <Timer className="size-4" />
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg bg-muted px-3.5 py-3">
      <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  )
}

function PlatformPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
      <Sparkles className="size-3" />
      {label}
    </span>
  )
}
