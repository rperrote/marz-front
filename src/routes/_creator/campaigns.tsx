import { createFileRoute } from '@tanstack/react-router'

import { CampaignBoardPage } from '#/features/discovery/campaign-board/CampaignBoardPage'
import { CampaignBoardSearchSchema } from '#/features/discovery/campaign-board/search-schema'

export const Route = createFileRoute('/_creator/campaigns')({
  validateSearch: (search) => CampaignBoardSearchSchema.parse(search),
  component: CampaignBoardPage,
})
