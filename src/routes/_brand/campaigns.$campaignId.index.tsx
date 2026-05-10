import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CampaignDetailPage } from '#/features/campaigns/detail/CampaignDetailPage'
import {
  DeliverableStatus,
  ListCampaignParticipantsPlatform,
  ListCampaignParticipantsStatus,
} from '#/shared/api/generated/model'

const campaignDetailTabSchema = z
  .enum(['overview', 'discovery', 'creators', 'videos', 'analytics'])
  .default('overview')
  .catch('overview')

const campaignDetailSectionSchema = z
  .enum(['matches', 'applications', 'active', 'invited'])
  .default('matches')
  .catch('matches')

const campaignDetailStatusSchema = z
  .union([z.enum(ListCampaignParticipantsStatus), z.enum(DeliverableStatus)])
  .optional()
  .catch(undefined)

const campaignParticipantsPlatformSchema = z
  .enum(ListCampaignParticipantsPlatform)
  .optional()
  .catch(undefined)

export const campaignDetailSearchSchema = z.object({
  tab: campaignDetailTabSchema,
  section: campaignDetailSectionSchema,
  q: z.string().optional().catch(undefined),
  status: campaignDetailStatusSchema,
  platform: campaignParticipantsPlatformSchema,
  creator_account_id: z.string().optional().catch(undefined),
  sort: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_brand/campaigns/$campaignId/')({
  validateSearch: (search) => campaignDetailSearchSchema.parse(search),
  component: CampaignDetailIndexRoute,
})

function CampaignDetailIndexRoute() {
  const { campaignId } = Route.useParams()
  const search = Route.useSearch()

  return <CampaignDetailPage campaignId={campaignId} search={search} />
}
