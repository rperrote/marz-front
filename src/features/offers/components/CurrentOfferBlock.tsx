import { useEffect, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Send, X } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { formatOfferDeadline } from '#/features/offers/utils/formatOffer'
import type { OfferDetailDTO, OfferMode } from '#/features/offers/types'
import type { DeliverableDTO } from '#/features/deliverables/types'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import { canMarkOfferAsPaid } from '#/shared/payments/markAsPaidEligibility'
import type { MarkAsPaidOffer } from '#/shared/payments/markAsPaidEligibility'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'
import { CancelOfferDialog } from './CancelOfferDialog'
import { OfferCountdown } from './OfferCountdown'
import { trackOfferEvent } from '../analytics'
import type { ActorKind } from '../analytics'
import { OfferDeliverablesList } from './OfferDeliverablesList'
import { formatBonusWindowsLabel } from '../utils/bonusTerms'
import { useOfferActions } from '#/features/offers/hooks/useOfferActions'

type StatusKey = OfferDetailDTO['status']

function getStatusConfig(): Record<
  StatusKey,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> {
  return {
    sent: { label: t`Enviada`, variant: 'secondary' },
    accepted: { label: t`Aceptada`, variant: 'default' },
    rejected: { label: t`Rechazada`, variant: 'destructive' },
    expired: { label: t`Expirada`, variant: 'outline' },
    cancelled: { label: t`Cancelada`, variant: 'destructive' },
  }
}

function getPaymentProgress(deliverables: DeliverableDTO[]) {
  const total = deliverables.length
  const paidCount = deliverables.filter((d) => d.status === 'paid').length

  return { paidCount, total }
}

function getOfferBadge(offer: OfferDetailDTO, deliverables: DeliverableDTO[]) {
  const progress = getPaymentProgress(deliverables)
  if (progress.total > 0 && progress.paidCount === progress.total) {
    return { label: t`Pagada en total`, variant: 'default' as const }
  }

  if (progress.paidCount > 0 && progress.paidCount < progress.total) {
    const paidCount = progress.paidCount
    const total = progress.total
    return {
      label: t`Pago parcial (${paidCount}/${total})`,
      variant: 'secondary' as const,
    }
  }

  return getStatusConfig()[offer.status]
}

function getOfferModeLabel(mode: OfferMode) {
  return mode === 'per_platform' ? t`Por plataforma` : t`Mismo contenido`
}

function getOfferPlatforms(offer: OfferDetailDTO) {
  const platforms =
    offer.platforms.length > 0
      ? offer.platforms
      : offer.deliverables.map((deliverable) => deliverable.platform)

  return Array.from(new Set(platforms)).filter(Boolean)
}

function formatOfferPlatformLabel(platform: string) {
  const platformLabels: Record<string, string> = {
    youtube: t`YouTube`,
    instagram: t`Instagram`,
    tiktok: t`TikTok`,
  }

  return platformLabels[platform] ?? platform
}

interface CurrentOfferBlockProps {
  offer: OfferDetailDTO | null
  actorKind: ActorKind
  conversationId?: string
  deliverables: DeliverableDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (offer: MarkAsPaidOffer) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

interface EmptyStateProps {
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

function EmptyState({ canSendOffer, onSendOffer }: EmptyStateProps) {
  const visible = canSendOffer?.visible ?? false
  const disabled = canSendOffer?.disabled ?? false

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-center text-sm text-muted-foreground">
        {t`Sin oferta activa`}
      </p>
      {visible && onSendOffer ? (
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => onSendOffer()}
          className="rounded-full"
        >
          <Send />
          {t`Enviar oferta`}
        </Button>
      ) : null}
    </div>
  )
}

export function CurrentOfferBlock({
  offer,
  actorKind,
  conversationId = '',
  deliverables,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
  canSendOffer,
  onSendOffer,
}: CurrentOfferBlockProps) {
  const trackedRef = useRef(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { accept, reject } = useOfferActions({ conversationId })

  useEffect(() => {
    if (offer && !trackedRef.current) {
      trackedRef.current = true

      trackOfferEvent('offer_panel_viewed', {
        actor_kind: actorKind,
        offer_state: offer.status,
      })
    }
  }, [offer, actorKind])

  if (!offer) {
    return <EmptyState canSendOffer={canSendOffer} onSendOffer={onSendOffer} />
  }

  const badge = getOfferBadge(offer, deliverables)
  const bonusLabel = formatBonusWindowsLabel(offer.bonus_terms ?? null)
  const currency = offer.currency
  const offerMode = offer.offer_mode
  const platforms = getOfferPlatforms(offer)
  const deadline = offer.offer_deadline
  const tentativePublishDate = offer.tentative_publish_date
  const paymentOffer: MarkAsPaidOffer = {
    id: offer.id,
    amount: offer.amount,
    status: offer.status,
    deliverables: deliverables.map((deliverable) => ({
      status: deliverable.status,
    })),
  }
  const canMarkAsPaid = canMarkOfferAsPaid(paymentOffer)
  const canShowBrandOfferActions =
    sessionKind === 'brand' &&
    (offer.status === 'sent' || offer.status === 'accepted')

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <header className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t`Oferta actual`}
            </span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              #{offer.id.slice(0, 8)}
            </span>
          </div>
          <Badge
            variant={badge.variant}
            className="shrink-0 rounded-full text-[11px]"
          >
            {badge.label}
          </Badge>
        </header>

        <dl className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Modo`}</dt>
            <dd className="text-xs font-medium text-foreground">
              {getOfferModeLabel(offerMode)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Presupuesto`}</dt>
            <dd className="font-mono text-xs font-semibold text-foreground">
              {formatOfferAmount(offer.amount, currency)}
            </dd>
          </div>
          {tentativePublishDate ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">{t`Publicación tentativa`}</dt>
              <dd className="text-xs font-medium text-foreground">
                {formatOfferDeadline(tentativePublishDate)}
              </dd>
            </div>
          ) : null}
          {deadline ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">{t`Fecha límite`}</dt>
              <dd className="text-xs font-medium text-foreground">
                {formatOfferDeadline(deadline)}
              </dd>
            </div>
          ) : null}
          {platforms.length > 0 ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">{t`Plataformas`}</dt>
              <dd className="text-right text-xs font-medium text-foreground">
                {platforms.map(formatOfferPlatformLabel).join(', ')}
              </dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Estado`}</dt>
            <dd className="text-xs font-medium text-foreground">
              {badge.label}
            </dd>
          </div>
          {bonusLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">{t`Bonus por rapidez`}</dt>
              <dd className="font-mono text-xs font-medium text-success">
                {bonusLabel}
              </dd>
            </div>
          ) : null}
        </dl>

        <OfferDeliverablesList
          offer={offer}
          deliverables={deliverables}
          sessionKind={sessionKind}
          viewerRole={viewerRole}
          actorKind={actorKind}
          onUploadDraft={onUploadDraft}
          onSubmitLink={onSubmitLink}
        />

        {canShowBrandOfferActions ? (
          <div className="mt-3 flex gap-2">
            {offer.status === 'accepted' && onMarkAsPaid ? (
              <Button
                size="sm"
                className="flex-1"
                disabled={!canMarkAsPaid}
                onClick={() => onMarkAsPaid(paymentOffer)}
              >
                {t`Marcar como pagado`}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setCancelDialogOpen(true)}
            >
              <X className="size-4" aria-hidden="true" />
              {offer.status === 'accepted'
                ? t`Cancelar oferta aceptada`
                : t`Cancelar oferta`}
            </Button>
          </div>
        ) : null}

        {sessionKind === 'creator' && offer.status === 'sent' ? (
          <>
            <OfferCountdown
              expiresAt={offer.expires_at}
              status={offer.status}
            />
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={accept.isPending || reject.isPending}
                onClick={() =>
                  accept.mutate({
                    offerId: offer.id,
                    sentAt: offer.sent_at ?? offer.created_at,
                    offerMode: offer.offer_mode,
                  })
                }
              >
                {accept.isPending ? t`Aceptando…` : t`Aceptar`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={accept.isPending || reject.isPending}
                onClick={() =>
                  reject.mutate({
                    offerId: offer.id,
                    sentAt: offer.sent_at ?? offer.created_at,
                    offerMode: offer.offer_mode,
                  })
                }
              >
                {reject.isPending ? t`Rechazando…` : t`Rechazar`}
              </Button>
            </div>
          </>
        ) : null}
      </div>
      <CancelOfferDialog
        offer={offer}
        conversationId={conversationId}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      />
    </>
  )
}
