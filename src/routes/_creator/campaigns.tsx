import { t } from '@lingui/core/macro'
import { createFileRoute } from '@tanstack/react-router'

import { CampaignBoardSearchSchema } from '#/features/discovery/campaign-board/search-schema'
import type { CampaignBoardSearch } from '#/features/discovery/campaign-board/search-schema'
import type { CreatorCampaignBoardResponse } from '#/shared/api/generated/model'

export const Route = createFileRoute('/_creator/campaigns')({
  validateSearch: (search) => CampaignBoardSearchSchema.parse(search),
  component: CreatorCampaignsPlaceholder,
})

function CreatorCampaignsPlaceholder() {
  const search: CampaignBoardSearch = Route.useSearch()
  const cards: CreatorCampaignBoardResponse['data'] = []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{t`Campañas`}</h1>
      <p className="text-muted-foreground mt-2">
        {t`El tablero de campañas está listo para conectarse al contrato generado.`}
      </p>
      <p className="text-muted-foreground mt-4 text-sm">
        {t`Orden actual`}: {search.sort}. {t`Campañas cargadas`}: {cards.length}
        .
      </p>
    </div>
  )
}
