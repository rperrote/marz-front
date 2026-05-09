import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

import {
  CampaignBoardGrid,
  CampaignBoardGridSkeleton,
} from './CampaignBoardGrid'
import { CampaignBoardHeader } from './CampaignBoardHeader'
import { useCampaignBoardQuery } from './hooks/useCampaignBoardQuery'
import type { CampaignBoardSearch } from './search-schema'

interface CampaignBoardPageProps {
  search: CampaignBoardSearch
  onRecommendedOnlyChange: (recommendedOnly: boolean) => void
}

export function CampaignBoardPage({
  search,
  onRecommendedOnlyChange,
}: CampaignBoardPageProps) {
  const boardQuery = useCampaignBoardQuery(search)
  const cards = boardQuery.data?.data ?? []

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-[1368px] flex-col gap-6 px-8 py-8">
        <CampaignBoardHeader
          counts={boardQuery.data?.counts}
          isRefreshing={boardQuery.isFetching && !boardQuery.isPending}
          recommendedOnly={search.recommended_only}
          onRefresh={() => void boardQuery.refetch()}
          onRecommendedOnlyChange={onRecommendedOnlyChange}
        />

        {boardQuery.isPending ? <CampaignBoardGridSkeleton /> : null}

        {boardQuery.isError ? (
          <CampaignBoardErrorState onRetry={() => void boardQuery.refetch()} />
        ) : null}

        {boardQuery.isSuccess && cards.length === 0 ? (
          <CampaignBoardEmptyState recommendedOnly={search.recommended_only} />
        ) : null}

        {boardQuery.isSuccess && cards.length > 0 ? (
          <CampaignBoardGrid cards={cards} />
        ) : null}
      </div>
    </main>
  )
}

function CampaignBoardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {t`No pudimos cargar las campañas`}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t`Intentá actualizar el board. Si sigue fallando, probá de nuevo más tarde.`}
        </p>
      </div>
      <Button type="button" className="rounded-xl" onClick={onRetry}>
        {t`Actualizar`}
      </Button>
    </section>
  )
}

function CampaignBoardEmptyState({
  recommendedOnly,
}: {
  recommendedOnly: boolean
}) {
  const message = recommendedOnly
    ? t`No tenemos recomendaciones para vos en este momento. Sacá el filtro para ver todo el board.`
    : t`Todavía no hay campañas abiertas que matcheen con vos. Te avisamos cuando lleguen.`

  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {t`Sin campañas por ahora`}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        data-ticket="F.4-creator-profile-navigation"
      >
        {t`Editar mi perfil`}
      </Button>
    </section>
  )
}
