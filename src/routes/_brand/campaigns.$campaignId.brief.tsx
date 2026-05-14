import { Megaphone } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { CampaignBriefPage } from '#/features/campaigns/components/CampaignBriefPage'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'

export const Route = createFileRoute('/_brand/campaigns/$campaignId/brief')({
  component: CampaignBriefRoute,
})

function CampaignBriefRoute() {
  const campaignBriefTopbarConfig = {
    breadcrumb: [
      { icon: Megaphone, label: t`Campañas` },
      { label: t`Resumen del brief` },
    ],
  }
  useRouteTopbar(campaignBriefTopbarConfig)

  const { campaignId } = Route.useParams()
  return <CampaignBriefPage campaignId={campaignId} />
}
