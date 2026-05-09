import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { CampaignBoardPage } from '#/features/discovery/campaign-board/CampaignBoardPage'
import { CampaignBoardSearchSchema } from '#/features/discovery/campaign-board/search-schema'
import type { CampaignBoardSearch } from '#/features/discovery/campaign-board/search-schema'

export const Route = createFileRoute('/_creator/campaigns')({
  validateSearch: (search) => CampaignBoardSearchSchema.parse(search),
  component: CreatorCampaignsRoute,
})

function CreatorCampaignsRoute() {
  const search: CampaignBoardSearch = Route.useSearch()
  const navigate = useNavigate({ from: '/campaigns' })

  function handleRecommendedOnlyChange(recommendedOnly: boolean) {
    void navigate({
      to: '.',
      unsafeRelative: 'path',
      search: (prev) => ({
        ...prev,
        recommended_only: recommendedOnly,
      }),
      replace: true,
    })
  }

  return (
    <CampaignBoardPage
      search={search}
      onRecommendedOnlyChange={handleRecommendedOnlyChange}
    />
  )
}
