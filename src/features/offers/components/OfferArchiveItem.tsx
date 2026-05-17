import { t } from '@lingui/core/macro'
import { ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import type { ArchivedOfferDetailItem } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import type {
  OfferCancellationPhase,
  OfferDetailDTO,
  OfferMode,
} from '#/features/offers/types'

const archiveDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateOnlyFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatArchiveDate(value: string) {
  return archiveDateFormatter.format(Date.parse(value))
}

function formatDateOnly(value: string) {
  return dateOnlyFormatter.format(Date.parse(value))
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

function getStatusDotClass(offer: OfferDetailDTO): string {
  if (offer.status === 'accepted') return 'bg-success'
  if (offer.status === 'rejected') return 'bg-destructive'
  if (offer.status === 'cancelled') return 'bg-warning'
  if (offer.status === 'expired') return 'bg-muted-foreground'
  return 'bg-info'
}

function getInlineStatusLabel(offer: OfferDetailDTO): string {
  if (offer.status === 'accepted' && offer.paid_at) return t`Pagada`
  if (offer.status === 'cancelled') {
    const phase = getCancellationPhase(offer)
    return phase === 'post_accept'
      ? t`Cancelada tras aceptación`
      : t`Cancelada`
  }
  switch (offer.status) {
    case 'sent':
      return t`Pendiente`
    case 'accepted':
      return t`Aceptada`
    case 'rejected':
      return t`Rechazada`
    case 'expired':
      return t`Vencida`
    default:
      return ''
  }
}

function getBonusSummary(offer: OfferDetailDTO): string {
  const windows = offer.bonus_terms?.speed_bonus_windows ?? []
  if (windows.length === 0) return t`Sin bonos`
  if (windows.length === 1) return t`1 bono por velocidad`
  return t`${windows.length} bonos por velocidad`
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-xs font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

interface OfferArchiveItemProps {
  item: ArchivedOfferDetailItem
}

export function OfferArchiveItem({ item }: OfferArchiveItemProps) {
  const offer = item.offer
  const badge = getBadgeConfig(offer)
  const modeLabel = getOfferModeLabel(offer.offer_mode)
  const currency = offer.currency
  const formattedAmount = formatOfferAmount(offer.amount, currency)
  const sentAt = offer.sent_at ?? offer.created_at
  const sentDate = formatArchiveDate(sentAt)
  const platforms = offer.platforms.length > 0 ? offer.platforms : null
  const bonusSummary = getBonusSummary(offer)
  const description = offer.description?.trim() || null
  const cancellationPhase = getCancellationPhase(offer)
  const inlineStatus = getInlineStatusLabel(offer)

  return (
    <li>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
            aria-label={t`Oferta de ${formattedAmount}, ${modeLabel}, ${inlineStatus}, enviada el ${sentDate}`}
          >
            <span
              className={`mt-1.5 inline-block size-2 shrink-0 self-start rounded-full ${getStatusDotClass(offer)}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formattedAmount}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {sentDate}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{inlineStatus}</span>
                <span aria-hidden="true">·</span>
                <span>{modeLabel}</span>
                {platforms ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{platforms.join(', ')}</span>
                  </>
                ) : null}
              </div>
            </div>
            <ChevronRight
              className="size-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <header className="mb-3 space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-base font-semibold text-foreground">
                {formattedAmount}
              </span>
              <Badge
                variant={badge.variant}
                className={`rounded-full text-[11px] ${badge.className ?? ''}`}
              >
                {badge.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {modeLabel}
              {platforms ? ` · ${platforms.join(', ')}` : null}
            </p>
          </header>

          <dl className="divide-y divide-border">
            <DetailRow label={t`Enviada`} value={sentDate} />
            {offer.tentative_publish_date ? (
              <DetailRow
                label={t`Publicación tentativa`}
                value={formatDateOnly(offer.tentative_publish_date)}
              />
            ) : null}
            {offer.offer_deadline ? (
              <DetailRow
                label={t`Fecha límite`}
                value={formatDateOnly(offer.offer_deadline)}
              />
            ) : null}
            {offer.status === 'accepted' && offer.accepted_at ? (
              <DetailRow
                label={t`Aceptada`}
                value={formatArchiveDate(offer.accepted_at)}
              />
            ) : null}
            {offer.paid_at ? (
              <DetailRow
                label={t`Pagada`}
                value={formatArchiveDate(offer.paid_at)}
              />
            ) : null}
            {offer.status === 'rejected' && offer.rejected_at ? (
              <DetailRow
                label={t`Rechazada`}
                value={formatArchiveDate(offer.rejected_at)}
              />
            ) : null}
            {offer.status === 'expired' && offer.expired_at ? (
              <DetailRow
                label={t`Vencida`}
                value={formatArchiveDate(offer.expired_at)}
              />
            ) : null}
            {offer.status === 'cancelled' && offer.cancelled_at ? (
              <DetailRow
                label={t`Cancelada`}
                value={formatArchiveDate(offer.cancelled_at)}
              />
            ) : null}
            {offer.status === 'cancelled' && cancellationPhase ? (
              <DetailRow
                label={t`Fase`}
                value={
                  cancellationPhase === 'post_accept'
                    ? t`Tras aceptación`
                    : t`Antes de aceptación`
                }
              />
            ) : null}
            <DetailRow label={t`Bonos`} value={bonusSummary} />
            {offer.reject_reason ? (
              <DetailRow
                label={t`Motivo de rechazo`}
                value={offer.reject_reason}
              />
            ) : null}
          </dl>

          {description ? (
            <div className="mt-3 space-y-1 rounded-lg bg-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t`Descripción`}
              </p>
              <p className="whitespace-pre-wrap break-words text-xs text-foreground">
                {description}
              </p>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </li>
  )
}
