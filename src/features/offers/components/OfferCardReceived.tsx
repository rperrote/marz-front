import { Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { SystemEventCard, StatTile } from '#/shared/ui/SystemEventCard'
import { useNow } from '#/shared/hooks/useNow'
import type { OfferSnapshot, OfferStatus } from '../types'
import {
  formatOfferAmount,
  formatOfferDeadline,
  formatOfferPlatform,
  formatExpiresIn,
  isOfferExpired,
} from '../utils/formatOffer'

interface OfferCardReceivedProps {
  snapshot: OfferSnapshot
  status: OfferStatus
  onAccept?: () => void
  onReject?: () => void
  isAccepting?: boolean
  isRejecting?: boolean
}

export function OfferCardReceived({
  snapshot,
  status,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: OfferCardReceivedProps) {
  const now = useNow()
  const amount = formatOfferAmount(snapshot.total_amount, snapshot.currency)
  const deadline = formatOfferDeadline(snapshot.deadline)
  const platform = formatOfferPlatform(snapshot.platform, snapshot.format)
  const expired = isOfferExpired(snapshot.expires_at, now)
  const actionsEnabled = status === 'sent' && !expired
  const expiresLabel = formatExpiresIn(snapshot.expires_at, now)

  return (
    <div
      role="article"
      aria-label={t`Campaign offer received, total ${amount}, deadline ${deadline}`}
    >
      <SystemEventCard
        tone="success"
        kicker={t`New campaign offer`}
        icon={Sparkles}
      >
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
                  className="flex-1"
                  onClick={onReject}
                  disabled={isAccepting || isRejecting}
                >
                  {isRejecting ? t`Rejecting…` : t`Reject`}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {expiresLabel}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-muted-foreground">
              {status === 'accepted' && t`Offer accepted`}
              {status === 'rejected' && t`Offer rejected`}
              {(status === 'expired' || (status === 'sent' && expired)) &&
                t`Offer expired`}
            </div>
          )}
        </div>
      </SystemEventCard>
    </div>
  )
}
