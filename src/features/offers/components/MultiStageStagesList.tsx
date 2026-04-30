import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import {
  formatOfferAmount,
  formatOfferDeadline,
} from '#/features/offers/utils/formatOffer'
import type { OfferStatus } from '#/features/offers/types'
import type { OfferStageDTO } from '../hooks/useConversationOffers'

interface MultiStageStagesListProps {
  stages: OfferStageDTO[]
  offerStatus: OfferStatus
  currency: string
}

function getDefaultExpanded(
  stages: OfferStageDTO[],
  offerStatus: OfferStatus,
): boolean[] {
  const expanded = stages.map(() => false)
  if (offerStatus === 'sent') {
    const firstNotApproved = stages.findIndex((s) => s.status !== 'approved')
    if (firstNotApproved !== -1) expanded[firstNotApproved] = true
  } else if (offerStatus === 'accepted') {
    const firstOpen = stages.findIndex((s) => s.status === 'open')
    if (firstOpen !== -1) expanded[firstOpen] = true
  }
  return expanded
}

const stageBadgeConfig: Record<
  OfferStageDTO['status'],
  {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }
> = {
  locked: { label: t`Locked`, variant: 'secondary' },
  open: { label: t`Open`, variant: 'default' },
  approved: {
    label: t`Approved`,
    className: 'bg-success text-success-foreground',
  },
}

export function MultiStageStagesList({
  stages,
  offerStatus,
  currency,
}: MultiStageStagesListProps) {
  const [openMap, setOpenMap] = useState(() =>
    getDefaultExpanded(stages, offerStatus),
  )

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const isOpen = openMap[i] ?? false
        const badge = stageBadgeConfig[stage.status]
        const deadline = formatOfferDeadline(stage.deadline)
        const amount = formatOfferAmount(stage.amount, currency)

        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-muted"
          >
            <button
              type="button"
              onClick={() =>
                setOpenMap((prev) => {
                  const next = [...prev]
                  next[i] = !next[i]
                  return next
                })
              }
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={isOpen}
              aria-label={t`Toggle stage ${stage.name}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {stage.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {deadline}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={badge.variant} className={badge.className}>
                  {badge.label}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-border px-4 py-3">
                {stage.description.length > 0 && (
                  <p className="text-sm text-foreground">{stage.description}</p>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t`Amount`}
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {amount}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
