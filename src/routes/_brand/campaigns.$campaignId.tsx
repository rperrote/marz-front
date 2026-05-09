import { createFileRoute } from '@tanstack/react-router'
import { CampaignBriefPage } from '#/features/campaigns/components/CampaignBriefPage'

export const Route = createFileRoute('/_brand/campaigns/$campaignId')({
  component: CampaignDetailRoute,
})

function CampaignDetailRoute() {
  const { campaignId } = Route.useParams()
  return <CampaignBriefPage campaignId={campaignId} />
}
