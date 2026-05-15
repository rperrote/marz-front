import { ChevronDown, Instagram, Sparkles, Timer, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { IconButton } from '#/shared/ui/IconButton'
import { StatTile, SystemEventCard } from '#/shared/ui/SystemEventCard'

/**
 * Platform icon map — matches the .pen palette (YouTube, Instagram). Extend as
 * other platforms land.
 */
const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
}

export interface OfferPlatform {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
  label: string
}

interface OfferCardBaseProps {
  title: string
  budget: string
  deadline: string
  platforms: Array<OfferPlatform>
}

interface OfferCardReceivedProps extends OfferCardBaseProps {
  variant: 'received'
  onAccept?: () => void
  onReject?: () => void
}

interface OfferCardSentProps extends OfferCardBaseProps {
  variant: 'sent'
  statusLabel?: string
}

type OfferCardProps = OfferCardReceivedProps | OfferCardSentProps

export function OfferCard(props: OfferCardProps) {
  const isReceived = props.variant === 'received'
  const kicker = isReceived ? t`New campaign offer` : t`Offer sent`
  const icon = isReceived ? Sparkles : Timer

  return (
    <SystemEventCard tone="success" kicker={kicker} icon={icon}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{props.title}</h3>

        <div className="flex gap-3">
          <StatTile label={t`Budget`} value={props.budget} />
          <StatTile label={t`Deadline`} value={props.deadline} />
        </div>

        <div className="flex flex-wrap gap-2">
          {props.platforms.map((p) => {
            const Icon = platformIcon[p.platform] ?? Sparkles
            return (
              <span
                key={`${p.platform}-${p.label}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <Icon className="size-4" />
                {p.label}
              </span>
            )
          })}
        </div>

        {isReceived ? (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={props.onAccept}>
              <Trans>Accept Offer</Trans>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={props.onReject}
            >
              <Trans>Reject</Trans>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Timer className="size-4" />
            {props.statusLabel ?? t`Awaiting response`}
          </div>
        )}
      </div>
    </SystemEventCard>
  )
}

interface OfferCardCollapsedProps {
  offerId: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'negotiating'
  label?: string
  onExpand?: () => void
}

function getStatusBadge(): Record<
  OfferCardCollapsedProps['status'],
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> {
  return {
    draft: { label: t`Draft`, variant: 'outline' },
    sent: { label: t`Sent`, variant: 'secondary' },
    accepted: { label: t`Accepted`, variant: 'default' },
    rejected: { label: t`Rejected`, variant: 'destructive' },
    expired: { label: t`Expired`, variant: 'outline' },
    negotiating: { label: t`Negotiating`, variant: 'secondary' },
  }
}

export function OfferCardCollapsed({
  offerId,
  status,
  label = t`Current Offer`,
  onExpand,
}: OfferCardCollapsedProps) {
  const badge = getStatusBadge()[status]
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">
        #{offerId}
      </span>
      <Badge variant={badge.variant} className="ml-auto">
        {badge.label}
      </Badge>
      <IconButton
        size="sm"
        shape="circle"
        aria-label={t`Expand offer`}
        onClick={onExpand}
      >
        <ChevronDown />
      </IconButton>
    </div>
  )
}
