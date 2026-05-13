import { useEffect, useRef } from 'react'
import { t } from '@lingui/core/macro'
import { Send } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { OfferDTO } from '#/features/offers/hooks/useConversationOffers'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { formatOfferDeadline } from '#/features/offers/utils/formatOffer'
import type { OfferStatus } from '#/features/offers/types'
import type { DeliverableDTO, StageDTO } from '#/features/deliverables/types'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'
import { trackOfferEvent } from '../analytics'
import type { ActorKind } from '../analytics'
import { OfferDeliverablesList } from './OfferDeliverablesList'
import { formatBonusWindowsLabel } from '../utils/bonusTerms'
import { useOfferActions } from '#/features/offers/hooks/useOfferActions'

const statusConfig: Record<
  OfferStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  sent: { label: t`Enviada`, variant: 'secondary' },
  accepted: { label: t`Aceptada`, variant: 'default' },
  rejected: { label: t`Rechazada`, variant: 'destructive' },
  expired: { label: t`Expirada`, variant: 'outline' },
}

function getPaymentProgress(deliverables: DeliverableDTO[]) {
  const total = deliverables.length
  const paidCount = deliverables.filter((d) => d.status === 'paid').length

  return { paidCount, total }
}

function getOfferBadge(offer: OfferDTO, deliverables: DeliverableDTO[]) {
  const progress = getPaymentProgress(deliverables)
  if (progress.total > 0 && progress.paidCount === progress.total) {
    return { label: t`Pagada en total`, variant: 'default' as const }
  }

  if (progress.paidCount > 0 && progress.paidCount < progress.total) {
    return {
      label: t`Pago parcial (${progress.paidCount}/${progress.total})`,
      variant: 'secondary' as const,
    }
  }

  return statusConfig[offer.status]
}

interface CurrentOfferBlockProps {
  offer: OfferDTO | null
  actorKind: ActorKind
  conversationId?: string
  deliverables: DeliverableDTO[]
  stages: StageDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
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
  stages,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
  canSendOffer,
  onSendOffer,
}: CurrentOfferBlockProps) {
  const trackedRef = useRef(false)
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
  const bonusLabel = formatBonusWindowsLabel(offer.bonus_terms)
  // RAFITA:BLOCKER currency no expuesto en OfferDTO — asumir USD hasta que backend lo agregue
  const currency = 'USD'

  return (
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
          <dt className="text-xs text-muted-foreground">{t`Presupuesto`}</dt>
          <dd className="font-mono text-xs font-semibold text-foreground">
            {formatOfferAmount(offer.amount, currency)}
          </dd>
        </div>
        {offer.deadline ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{t`Deadline`}</dt>
            <dd className="text-xs font-medium text-foreground">
              {formatOfferDeadline(offer.deadline)}
            </dd>
          </div>
        ) : null}
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
        stages={stages}
        sessionKind={sessionKind}
        viewerRole={viewerRole}
        actorKind={actorKind}
        onUploadDraft={onUploadDraft}
        onMarkAsPaid={onMarkAsPaid}
        onSubmitLink={onSubmitLink}
      />

      {sessionKind === 'creator' && offer.status === 'sent' ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={accept.isPending || reject.isPending}
            onClick={() =>
              accept.mutate({
                offerId: offer.id,
                sentAt: offer.sent_at ?? offer.created_at,
                offerType: offer.type,
              })
            }
          >
            {accept.isPending ? t`Aceptando…` : t`Aceptar oferta`}
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
                offerType: offer.type,
              })
            }
          >
            {reject.isPending ? t`Rechazando…` : t`Rechazar`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
