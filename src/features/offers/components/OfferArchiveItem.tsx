import { t } from '@lingui/core/macro'
import { ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import type { ArchivedOfferDetailItem } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import type {
  OfferCancellationPhase,
  OfferDetailDTO,
  OfferMode,
} from '#/features/offers/types'

const archiveDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatArchiveDate(value: string) {
  return archiveDateFormatter.format(Date.parse(value))
}

function getCancellationPhase(
  offer: OfferDetailDTO,
): OfferCancellationPhase | null {
  if (offer.cancellation_phase) return offer.cancellation_phase
  return null
}

function getOfferModeLabel(mode: OfferMode): string {
  return mode === 'per_platform' ? t`Por plataforma` : t`Un contenido`
}

function getBadgeConfig(offer: OfferDetailDTO): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
} {
  if (offer.status === 'accepted' && offer.paid_at) {
    return {
      label: t`Aceptada (pagada)`,
      variant: 'default',
      className: 'bg-success text-success-foreground',
    }
  }

  if (offer.status === 'cancelled') {
    const phase = getCancellationPhase(offer)
    return {
      label:
        phase === 'post_accept' ? t`Cancelada (post)` : t`Cancelada (pre)`,
      variant: 'outline',
      className: 'border-warning/40 bg-warning/10 text-warning',
    }
  }

  const configs = {
    sent: { label: t`Pendiente`, variant: 'secondary' as const },
    accepted: {
      label: t`Aceptada`,
      variant: 'default' as const,
      className: 'bg-success text-success-foreground',
    },
    rejected: { label: t`Rechazada`, variant: 'destructive' as const },
    expired: { label: t`Expirada`, variant: 'outline' as const },
  } satisfies Record<
    Exclude<OfferDetailDTO['status'], 'cancelled'>,
    {
      label: string
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      className?: string
    }
  >

  return configs[offer.status]
}

interface OfferArchiveItemProps {
  item: ArchivedOfferDetailItem
}

export function OfferArchiveItem({ item }: OfferArchiveItemProps) {
  const offer = item.offer
  const badge = getBadgeConfig(offer)
  const modeLabel = getOfferModeLabel(offer.offer_mode)
  const currency = offer.currency
  // RAFITA:BLOCKER campaign_name no expuesto en OfferDTO — usar id corto hasta que backend lo agregue
  const campaignLabel = offer.campaign_id.slice(0, 8)
  const sentAt = offer.sent_at ?? offer.created_at

  const sentDate = formatArchiveDate(sentAt)

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
        aria-label={`${campaignLabel} — ${formatOfferAmount(offer.amount, currency)} — ${modeLabel} — ${badge.label}`}
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
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {modeLabel}
          </span>
          <Badge
            variant={badge.variant}
            className={`shrink-0 rounded-full text-[11px] ${badge.className ?? ''}`}
          >
            {badge.label}
          </Badge>
        </div>
        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
