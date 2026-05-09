import { t } from '@lingui/core/macro'

import type { CreatorCampaignBoardCard } from '#/shared/api/generated/model'

import { CampaignBoardCard } from './CampaignBoardCard'

interface CampaignBoardGridProps {
  cards: CreatorCampaignBoardCard[]
  onViewBrief: (campaignId: string) => void
  onApply: (card: CreatorCampaignBoardCard) => void
}

export function CampaignBoardGrid({
  cards,
  onViewBrief,
  onApply,
}: CampaignBoardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <CampaignBoardCard
          key={card.campaign_id}
          card={card}
          onViewBrief={onViewBrief}
          onApply={onApply}
        />
      ))}
    </div>
  )
}

export function CampaignBoardGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label={t`Cargando campañas`}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="min-h-[292px] animate-pulse rounded-2xl border border-border bg-card"
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="size-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded-full bg-muted" />
              <div className="h-3 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-7 w-16 rounded-full bg-muted" />
            <div className="h-7 w-14 rounded-full bg-muted" />
          </div>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-full bg-muted" />
              <div className="h-7 w-28 rounded-full bg-muted" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-10 rounded-full bg-muted" />
                <div className="h-4 w-24 rounded-full bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-xl bg-muted" />
                <div className="h-8 w-24 rounded-xl bg-muted" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
