import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Timer } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { SystemEventCard, StatTile } from '#/shared/ui/SystemEventCard'
import { useNow } from '#/shared/hooks/useNow'
import type { OfferSnapshotMultiStage, OfferStatus } from '../types'
import {
  formatOfferAmount,
  formatOfferDeadline,
  formatExpiresIn,
  isOfferExpired,
} from '../utils/formatOffer'
import { getStatusConfig } from '../utils/offerStatus'
import { trackOfferEvent } from '../analytics'
import { OfferHeader } from './OfferHeader'

interface OfferCardMultiStageProps {
  snapshot: OfferSnapshotMultiStage
  status: OfferStatus
  side: 'out' | 'in'
  onAccept?: () => void
  onReject?: () => void
  isAccepting?: boolean
  isRejecting?: boolean
}

interface StageCardProps {
  stage: OfferSnapshotMultiStage['stages'][number]
  currency: string
  stageIndex: number
  actorKind: 'brand' | 'creator'
}

function StageCard({ stage, currency, stageIndex, actorKind }: StageCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const deadline = formatOfferDeadline(stage.deadline)
  const amount = formatOfferAmount(stage.amount, currency)

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next) {
      trackOfferEvent('stage_expanded', {
        actor_kind: actorKind,
        offer_type: 'multistage',
        stage_index: stageIndex,
        surface: 'card',
      })
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
        aria-label={t`Toggle stage ${stage.name}`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{stage.name}</span>
          <span className="text-xs text-muted-foreground">{deadline}</span>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0" />
        ) : (
          <ChevronDown className="size-4 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">{t`Amount`}</span>
            <span className="font-mono font-semibold text-foreground">
              {amount}
            </span>
          </div>

          {stage.description.length > 0 && (
            <div>
              <p
                className={cn(
                  'text-sm text-foreground',
                  !descExpanded && 'line-clamp-3',
                )}
              >
                {stage.description}
              </p>
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-1 text-xs text-primary"
                aria-expanded={descExpanded}
              >
                {descExpanded ? t`Show less` : t`Show more`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function OfferCardMultiStage({
  snapshot,
  status,
  side,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: OfferCardMultiStageProps) {
  const now = useNow()
  const expired = isOfferExpired(snapshot.expires_at, now)
  const actionsEnabled = side === 'in' && status === 'sent' && !expired
  const amount = formatOfferAmount(snapshot.total_amount, snapshot.currency)
  const badge = getStatusConfig(status)
  const kicker = side === 'out' ? t`Offer sent` : t`New campaign offer`
  const icon = side === 'out' ? Timer : Sparkles
  const actorKind = side === 'out' ? 'brand' : 'creator'

  return (
    <div
      role="article"
      data-testid="offer-card-multistage"
      aria-label={t`Multi-stage offer, total ${amount}, status ${badge.label}`}
    >
      <SystemEventCard tone="success" kicker={kicker} icon={icon}>
        <div className="space-y-4">
          <OfferHeader campaignName={snapshot.campaign_name} />

          <div className="flex gap-3">
            <StatTile label={t`Budget`} value={amount} />
            <StatTile
              label={t`Stages`}
              value={String(snapshot.stages.length)}
            />
          </div>

          <div className="space-y-2">
            {snapshot.stages.map((stage, i) => (
              <StageCard
                key={i}
                stage={stage}
                currency={snapshot.currency}
                stageIndex={i}
                actorKind={actorKind}
              />
            ))}
          </div>

          <div className="flex items-baseline justify-between rounded-2xl bg-accent px-4 py-3">
            <span className="text-sm text-muted-foreground">{t`Total`}</span>
            <span className="font-mono text-lg font-semibold text-foreground">
              {amount}
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
