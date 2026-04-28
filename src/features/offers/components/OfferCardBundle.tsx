import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Timer } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { SystemEventCard, StatTile } from '#/shared/ui/SystemEventCard'
import { useNow } from '#/shared/hooks/useNow'
import type { OfferSnapshotBundle, OfferStatus } from '../types'
import {
  formatOfferAmount,
  formatOfferDeadline,
  formatOfferPlatform,
  formatExpiresIn,
  isOfferExpired,
} from '../utils/formatOffer'
import { getStatusConfig } from '../utils/offerStatus'
import { DeliverableSummaryRow } from './DeliverableSummaryRow'
import { OfferHeader } from './OfferHeader'

interface OfferCardBundleProps {
  snapshot: OfferSnapshotBundle
  status: OfferStatus
  side: 'out' | 'in'
  onAccept?: () => void
  onReject?: () => void
  isAccepting?: boolean
  isRejecting?: boolean
}

export function OfferCardBundle({
  snapshot,
  status,
  side,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: OfferCardBundleProps) {
  const now = useNow()
  const [expanded, setExpanded] = useState(false)
  const expired = isOfferExpired(snapshot.expires_at, now)
  const actionsEnabled = side === 'in' && status === 'sent' && !expired
  const amount = formatOfferAmount(snapshot.total_amount, snapshot.currency)
  const deadline = formatOfferDeadline(snapshot.deadline)
  const badge = getStatusConfig(status)
  const kicker = side === 'out' ? t`Offer sent` : t`New campaign offer`
  const icon = side === 'out' ? Timer : Sparkles

  return (
    <div
      role="article"
      aria-label={t`Bundle offer, total ${amount}, deadline ${deadline}, status ${badge.label}`}
    >
      <SystemEventCard tone="success" kicker={kicker} icon={icon}>
        <div className="space-y-4">
          <OfferHeader campaignName={snapshot.campaign_name} />

          <div className="flex gap-3">
            <StatTile label={t`Budget`} value={amount} />
            <StatTile label={t`Deadline`} value={deadline} />
          </div>

          {snapshot.speed_bonus ? (
            <div className="flex items-baseline justify-between gap-4 rounded-xl bg-muted px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {t`Speed bonus`}
              </span>
              <span className="font-mono text-xs font-medium text-success">
                +
                {formatOfferAmount(
                  snapshot.speed_bonus.bonus_amount,
                  snapshot.speed_bonus.currency,
                )}
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm text-foreground hover:bg-muted/80"
            aria-expanded={expanded}
            aria-label={
              expanded ? t`Collapse deliverables` : t`Expand deliverables`
            }
          >
            <span>{t`Deliverables`}</span>
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {expanded && (
            <div className="space-y-2">
              {snapshot.deliverables.map((d, i) => (
                <DeliverableSummaryRow
                  key={i}
                  label={`${formatOfferPlatform(d.platform, d.format)} × ${d.quantity}`}
                  amount={d.amount}
                  currency={snapshot.currency}
                />
              ))}
              <DeliverableSummaryRow
                label={t`Total`}
                amount={snapshot.total_amount}
                currency={snapshot.currency}
                emphasis="strong"
              />
            </div>
          )}

          {actionsEnabled ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={onAccept}
                  disabled={isAccepting || isRejecting}
                >
                  {isAccepting ? t`Accepting…` : t`Accept Offer`}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={onReject}
                  disabled={isAccepting || isRejecting}
                >
                  {isRejecting ? t`Rejecting…` : t`Reject`}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {formatExpiresIn(snapshot.expires_at, now)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm">
              <span
                className={badge.className}
                aria-label={t`Status: ${badge.label}`}
              >
                {badge.label}
              </span>
            </div>
          )}
        </div>
      </SystemEventCard>
    </div>
  )
}
