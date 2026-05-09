import { t } from '@lingui/core/macro'
import { ChevronDown, RefreshCw } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { Button } from '#/components/ui/button'
import type { CreatorCampaignBoardCounts } from '#/shared/api/generated/model'

interface CampaignBoardHeaderProps {
  counts?: CreatorCampaignBoardCounts
  isRefreshing: boolean
  recommendedOnly: boolean
  onRefresh: () => void
  onRecommendedOnlyChange: (recommendedOnly: boolean) => void
}

export function CampaignBoardHeader({
  counts,
  isRefreshing,
  recommendedOnly,
  onRefresh,
  onRecommendedOnlyChange,
}: CampaignBoardHeaderProps) {
  const totalVisible = counts?.matching_filters ?? counts?.total_visible ?? 0
  const recommended = counts?.recommended ?? 0
  const switchLabel = t`Solo recomendadas para mí`

  function toggleRecommendedOnly() {
    onRecommendedOnlyChange(!recommendedOnly)
  }

  function handleRecommendedOnlyKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    toggleRecommendedOnly()
  }

  return (
    <header className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {t`Campañas abiertas`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t`Postulate a las que matchean con tu perfil. Cuanto más completo tu perfil, mejor el match.`}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={isRefreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          {t`Actualizar`}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-5">
        <div className="flex flex-wrap items-center gap-2">
          {[
            t`Categoría`,
            t`Plataforma`,
            t`Deliverable`,
            t`Fee range`,
            t`Match score`,
          ].map((label) => (
            <button
              key={label}
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm"
            >
              {label}
              <ChevronDown
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <div
          role="switch"
          tabIndex={0}
          aria-checked={recommendedOnly}
          aria-label={switchLabel}
          onClick={toggleRecommendedOnly}
          onKeyDown={handleRecommendedOnlyKeyDown}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm"
        >
          {switchLabel}
          <span
            className={`flex h-6 w-10 items-center rounded-full p-0.5 ${
              recommendedOnly
                ? 'justify-end bg-primary'
                : 'justify-start bg-muted'
            }`}
            aria-hidden="true"
          >
            <span className="size-5 rounded-full bg-primary-foreground" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {t`${totalVisible} campañas`}
          </p>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <p className="text-xs text-muted-foreground">
            {t`${recommended} recomendadas para vos`}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          {t`Ordenar:`}
          <span className="font-medium text-foreground">{t`Match score`}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
