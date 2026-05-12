import { useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { useNow } from '#/shared/hooks/useNow'
import { useViewedOnce } from '#/shared/hooks/useViewedOnce'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import type { OfferSnapshot, OfferStatus } from '../types'
import {
  formatOfferDeadline,
  formatOfferPlatform,
  formatExpiresIn,
  isOfferExpired,
} from '../utils/formatOffer'
import { trackOfferEvent, markOfferSeen } from '../analytics'

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

  const cardRef = useRef<HTMLDivElement>(null)

  useViewedOnce(cardRef, () => {
    if (!markOfferSeen(snapshot.offer_id, 'offer_received_seen')) return
    const offerAgeSeconds = Math.floor(
      (Date.now() - new Date(snapshot.sent_at).getTime()) / 1000,
    )
    trackOfferEvent('offer_received_seen', {
      actor_kind: 'creator',
      offer_type: snapshot.type,
      offer_age_seconds: offerAgeSeconds,
    })
  })

  return (
    <div className="flex justify-start">
      <div
        ref={cardRef}
        role="article"
        aria-label={t`Oferta de campaña recibida, total ${amount}, deadline ${deadline}`}
        className="w-full max-w-[460px] overflow-hidden rounded-xl border-2 border-primary bg-card"
      >
        <div className="flex items-center gap-2 border-b border-primary/40 bg-accent px-4 py-2.5">
          <Sparkles className="size-3 text-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            {t`Nueva oferta de campaña`}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            {snapshot.campaign_name}
          </h3>

          <div className="flex gap-3">
            <StatTile label={t`Presupuesto`} value={amount} />
            <StatTile label={t`Deadline`} value={deadline} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <PlatformPill label={platform} />
          </div>

          {actionsEnabled ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={onAccept}
                  disabled={isAccepting || isRejecting}
                >
                  {isAccepting ? t`Aceptando…` : t`Aceptar oferta`}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onReject}
                  disabled={isAccepting || isRejecting}
                >
                  {isRejecting ? t`Rechazando…` : t`Rechazar`}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {expiresLabel}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-md bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
              {status === 'accepted' && t`Oferta aceptada`}
              {status === 'rejected' && t`Oferta rechazada`}
              {(status === 'expired' || (status === 'sent' && expired)) &&
                t`Oferta expirada`}
            </div>
          )}
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
