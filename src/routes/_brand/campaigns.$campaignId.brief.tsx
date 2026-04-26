import { createFileRoute } from '@tanstack/react-router'
import { CampaignBriefPage } from '#/features/campaigns/components/CampaignBriefPage'

export const Route = createFileRoute('/_brand/campaigns/$campaignId/brief')({
  component: CampaignBriefRoute,
})

function CampaignBriefRoute() {
  const { campaignId } = Route.useParams()
  return <CampaignBriefPage campaignId={campaignId} />
}
