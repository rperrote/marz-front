import { t } from '@lingui/core/macro'
import { CalendarClock } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { CreatorCampaignBoardCard } from '#/shared/api/generated/model'

import { MatchScoreBadge } from './MatchScoreBadge'

interface CampaignBoardCardProps {
  card: CreatorCampaignBoardCard
  onViewBrief: (campaignId: string) => void
  onApply: (card: CreatorCampaignBoardCard) => void
}

type SnapshotRecord = Record<string, unknown>

interface DeliverableChip {
  platform: string
  format: string
  quantity?: number
}

function getSnapshotString(
  snapshot: SnapshotRecord,
  key: string,
): string | null {
  const value = snapshot[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function getCampaignDeliverables(
  campaign: SnapshotRecord,
  fallbackDeliverables: string[],
  fallbackPlatforms: string[],
): DeliverableChip[] {
  const campaignDeliverables = campaign.deliverables
  if (Array.isArray(campaignDeliverables)) {
    return campaignDeliverables.flatMap((deliverable): DeliverableChip[] => {
      if (
        typeof deliverable !== 'object' ||
        deliverable === null ||
        Array.isArray(deliverable)
      ) {
        return []
      }

      const record = deliverable as SnapshotRecord
      const platform = getSnapshotString(record, 'platform')
      const format = getSnapshotString(record, 'format')
      const quantity = record.quantity

      if (!platform || !format) return []

      return [
        {
          platform,
          format,
          quantity: typeof quantity === 'number' ? quantity : undefined,
        },
      ]
    })
  }

  if (fallbackDeliverables.length === 0) return []

  return fallbackDeliverables.map((format, index) => ({
    format,
    platform: fallbackPlatforms[index] ?? fallbackPlatforms[0] ?? t`General`,
  }))
}

function formatDeliverableChip(deliverable: DeliverableChip) {
  const label = `${formatLabel(deliverable.platform)} · ${formatLabel(deliverable.format)}`
  if (!deliverable.quantity || deliverable.quantity <= 1) return label
  return `${deliverable.quantity}x ${label}`
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function parseDeadlineDate(deadline: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline)
  if (!dateOnly) return new Date(deadline)

  const [, year, month, day] = dateOnly
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function formatDeadline(
  deadline: string | null,
  now: Date = new Date(),
) {
  if (!deadline) return t`Sin deadline`

  const deadlineDate = parseDeadlineDate(deadline)
  if (Number.isNaN(deadlineDate.getTime())) return t`Sin deadline`

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadlineStart = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate(),
  )
  const diffDays = Math.ceil(
    (deadlineStart.getTime() - todayStart.getTime()) / 86_400_000,
  )

  if (diffDays < 0) return t`Venció`
  if (diffDays === 0) return t`Hoy`
  if (diffDays === 1) return t`Mañana`
  return t`En ${diffDays} días`
}

function getApplicationPrimaryLabel(card: CreatorCampaignBoardCard) {
  if (card.application.can_apply) return t`Postularme`
  if (card.application.status === 'submitted') return t`Postulación enviada`
  if (card.application.status === 'accepted') return t`Aceptada`
  if (card.application.status === 'rejected') return t`Rechazada`
  return t`No disponible`
}

export function CampaignBoardCard({
  card,
  onViewBrief,
  onApply,
}: CampaignBoardCardProps) {
  const brandName = getSnapshotString(card.brand, 'name') ?? t`Marca`
  const brandInitials =
    getSnapshotString(card.brand, 'avatar_initials') ?? getInitials(brandName)
  const brandVertical = getSnapshotString(card.brand, 'vertical')
  const logoUrl = getSnapshotString(card.brand, 'logo_url')
  const campaignName = getSnapshotString(card.campaign, 'name') ?? t`Campaña`
  const description =
    getSnapshotString(card.campaign, 'description_preview') ??
    t`Brief disponible para revisar antes de postularte.`
  const deadline = getSnapshotString(card.campaign, 'deadline')
  const feeLabel =
    getSnapshotString(card.economics, 'fee_label') ?? t`Fee a definir`
  const deliverables = getCampaignDeliverables(
    card.campaign,
    card.targeting.deliverables,
    card.targeting.platforms,
  )
  const visibleDeliverables = deliverables.slice(0, 3)
  const hiddenDeliverables = deliverables.length - visibleDeliverables.length
  const matchReason =
    !card.match.profile_complete && card.match.mismatch_reasons.length > 0
      ? card.match.mismatch_reasons[0]
      : undefined

  return (
    <article
      className="flex min-h-[292px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      aria-labelledby={`campaign-${card.campaign_id}`}
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            brandInitials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {brandName}
          </p>
          {brandVertical ? (
            <Badge
              variant="outline"
              className="mt-1 max-w-full truncate rounded-full px-2 py-0 text-[11px] text-muted-foreground"
            >
              {formatLabel(brandVertical)}
            </Badge>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <MatchScoreBadge score={card.match.score} />
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="size-3" aria-hidden="true" />
            {formatDeadline(deadline)}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <h2
              id={`campaign-${card.campaign_id}`}
              className="line-clamp-2 text-base font-semibold text-foreground"
            >
              {campaignName}
            </h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleDeliverables.map((deliverable) => (
              <Badge
                key={`${deliverable.platform}-${deliverable.format}`}
                variant="outline"
                className="rounded-full px-2.5 py-1 text-xs text-foreground"
              >
                {formatDeliverableChip(deliverable)}
              </Badge>
            ))}
            {hiddenDeliverables > 0 ? (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-1 text-xs"
              >
                +{hiddenDeliverables}
              </Badge>
            ) : null}
          </div>

          {matchReason ? (
            <p className="rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              {matchReason}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t`Fee`}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {feeLabel}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onViewBrief(card.campaign_id)}
            >
              {t`Ver brief`}
            </Button>
            {card.application.status === 'submitted' ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {t`Postulación enviada`}
                </Badge>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-8 px-0"
                  onClick={() => onViewBrief(card.campaign_id)}
                >
                  {t`Ver postulación`}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className={cn(
                  'rounded-xl',
                  (!card.application.can_apply ||
                    card.application.status !== 'none') &&
                    'px-3',
                )}
                disabled={
                  !card.application.can_apply ||
                  card.application.status !== 'none'
                }
                onClick={() => onApply(card)}
              >
                {getApplicationPrimaryLabel(card)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
