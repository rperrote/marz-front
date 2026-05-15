import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import { DeliverableListItem } from '#/features/deliverables/components/DeliverableListItem'
import { ExpectedDeliverableSlot } from '#/features/deliverables/components/ExpectedDeliverableSlot'
import type { DeliverableDTO, StageDTO } from '#/features/deliverables/types'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { formatOfferDeadline } from '#/features/offers/utils/formatOffer'
import type { OfferDetailDTO, OfferStatus } from '#/features/offers/types'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import type { OfferStageDTO } from '#/shared/api/generated/model'
import { trackOfferEvent } from '../analytics'
import type { ActorKind } from '../analytics'

interface OfferDeliverablesListProps {
  offer: OfferDetailDTO
  deliverables: DeliverableDTO[]
  stages: StageDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  actorKind: ActorKind
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

export function OfferDeliverablesList(props: OfferDeliverablesListProps) {
  const { offer } = props

  if (offer.type === 'multistage') {
    return <MultistageList {...props} />
  }

  return <FlatList {...props} />
}

function toExpectedDeliverableOfferStatus(
  status: OfferDetailDTO['status'],
): OfferStatus {
  // ExpectedDeliverableSlot no conoce 'cancelled'; tratar como expired para mostrar el slot en estado final sin acción.
  return status === 'cancelled' ? 'expired' : status
}

function FlatList({
  offer,
  deliverables,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: OfferDeliverablesListProps) {
  const showExpectedSingle =
    deliverables.length === 0 && offer.type === 'single'

  if (deliverables.length === 0 && !showExpectedSingle) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t`Entregables`}
      </div>
      <div className="space-y-2">
        {showExpectedSingle ? (
          <ExpectedDeliverableSlot
            platform={offer.deliverable.platform}
            format={offer.deliverable.format}
            sessionKind={sessionKind}
            offerStatus={toExpectedDeliverableOfferStatus(offer.status)}
          />
        ) : (
          deliverables.map((deliverable) => (
            <DeliverableListItem
              key={deliverable.id}
              deliverable={deliverable}
              sessionKind={sessionKind}
              viewerRole={viewerRole}
              onUploadDraft={onUploadDraft}
              onMarkAsPaid={onMarkAsPaid}
              onSubmitLink={onSubmitLink}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MultistageList({
  offer,
  deliverables,
  stages,
  sessionKind,
  viewerRole,
  actorKind,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: OfferDeliverablesListProps) {
  // RAFITA:ASSUMPTION OfferStageDTO no expone `id` todavía, así que el cruce
  // entre stages del offer y stages del endpoint de deliverables va por índice.
  // Asume que ambos endpoints devuelven stages ordenados por `position` y con
  // la misma cardinalidad. Cuando marz-api agregue `id` a OfferStageDTO, este
  // join se vuelve un Map<id, StageDTO> de 2 líneas.
  // RAFITA:BLOCKER currency no expuesto en OfferDTO — asumir USD hasta que backend lo agregue

  const currency = 'USD'
  const offerStages = offer.type === 'multistage' ? offer.stages : []
  const stagesByIndex: (StageDTO | undefined)[] = offerStages.map(
    (_, i) => stages[i],
  )

  const deliverableById = new Map(deliverables.map((d) => [d.id, d]))

  const [openMap, setOpenMap] = useState<boolean[]>(() =>
    getDefaultExpanded(
      offerStages,
      toExpectedDeliverableOfferStatus(offer.status),
    ),
  )

  if (offer.type !== 'multistage') return null

  const handleToggle = (i: number) => {
    const next = !(openMap[i] ?? false)
    setOpenMap((prev) => {
      const out = [...prev]
      out[i] = next
      return out
    })
    if (next) {
      trackOfferEvent('stage_expanded', {
        actor_kind: actorKind,

        offer_type: 'multistage',
        stage_index: i,

        surface: 'panel',
      })
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t`Etapas`}
      </div>
      <div className="space-y-2">
        {offer.stages.map((stage, i) => {
          const isOpen = openMap[i] ?? false
          const stageInfo = stagesByIndex[i]
          const stageDeliverables: DeliverableDTO[] = []
          for (const id of stageInfo?.deliverable_ids ?? []) {
            const d = deliverableById.get(id)
            if (d) stageDeliverables.push(d)
          }

          return (
            <StageGroup
              key={stageInfo?.id ?? `${stage.name}:${stage.deadline}`}
              stage={stage}
              currency={currency}
              isOpen={isOpen}
              onToggle={() => handleToggle(i)}
              deliverables={stageDeliverables}
              sessionKind={sessionKind}
              viewerRole={viewerRole}
              onUploadDraft={onUploadDraft}
              onMarkAsPaid={onMarkAsPaid}
              onSubmitLink={onSubmitLink}
            />
          )
        })}
      </div>
    </div>
  )
}

interface StageGroupProps {
  stage: OfferStageDTO
  currency: string
  isOpen: boolean
  onToggle: () => void
  deliverables: DeliverableDTO[]
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

type StageStatus = NonNullable<OfferStageDTO['status']>

function getStageBadge(): Record<
  StageStatus,
  { label: string; className: string }
> {
  return {
    locked: { label: t`Próximo`, className: 'bg-muted text-foreground' },
    open: { label: t`Abierto`, className: 'bg-info text-info-foreground' },
    approved: {
      label: t`Listo`,
      className: 'bg-success text-success-foreground',
    },
  }
}

function StageGroup({
  stage,
  currency,
  isOpen,
  onToggle,
  deliverables,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: StageGroupProps) {
  const stageStatus: StageStatus = stage.status ?? 'locked'
  const badge = getStageBadge()[stageStatus]
  const isLocked = stageStatus === 'locked'
  const stageName = stage.name

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-muted',
        isLocked && 'opacity-70',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={t`Alternar etapa ${stageName}`}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {stage.name}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatOfferDeadline(stage.deadline)} ·{' '}
            {formatOfferAmount(stage.amount, currency)}
          </span>
        </div>
        <Badge className={cn('rounded-full text-[10px]', badge.className)}>
          {badge.label}
        </Badge>
        {isOpen ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-border p-3">
          {stage.description.length > 0 && (
            <p className="text-xs text-foreground">{stage.description}</p>
          )}
          {deliverables.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t`Todavía no hay entregables.`}
            </p>
          ) : (
            <div className="space-y-2">
              {deliverables.map((d) => (
                <DeliverableListItem
                  key={d.id}
                  deliverable={d}
                  stageStatus={stageStatus}
                  sessionKind={sessionKind}
                  viewerRole={viewerRole}
                  onUploadDraft={onUploadDraft}
                  onMarkAsPaid={onMarkAsPaid}
                  onSubmitLink={onSubmitLink}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getDefaultExpanded(
  stages: OfferStageDTO[],
  offerStatus: OfferStatus,
): boolean[] {
  const expanded = stages.map(() => false)
  if (offerStatus === 'sent') {
    const i = stages.findIndex((s) => (s.status ?? 'locked') !== 'approved')
    if (i !== -1) expanded[i] = true
  } else if (offerStatus === 'accepted') {
    const i = stages.findIndex((s) => s.status === 'open')
    if (i !== -1) expanded[i] = true
  }
  return expanded
}
