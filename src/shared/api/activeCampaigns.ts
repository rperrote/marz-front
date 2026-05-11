import {
  getListCampaignsQueryKey,
  useListCampaigns,
} from '#/shared/api/generated/campaigns/campaigns'
import { CampaignConfigurationStatus } from '#/shared/api/generated/model'

export interface ActiveCampaign {
  id: string
  name: string
  status: 'active'
  budget_currency: string
  budget_remaining: string
}

export function getActiveCampaignsQueryKey() {
  return getListCampaignsQueryKey({
    status: CampaignConfigurationStatus.active,
  })
}

// RAFITA:BLOCKER: brandWorkspaceId hardcoded to 'default' — no workspace store exposed by Identity yet.
// When Identity exposes the active workspace via session/store, replace 'default' with the real id.
export function useActiveCampaigns(options?: { enabled?: boolean }) {
  return useListCampaigns(
    { status: CampaignConfigurationStatus.active },
    {
      query: {
        enabled: options?.enabled ?? true,
        select: (response): ActiveCampaign[] => {
          if (response.status !== 200) return []
          return response.data.data.map((item) => ({
            id: item.campaign_id,
            name: item.name,
            status: 'active' as const,
            budget_currency: item.budget.currency,
            budget_remaining: item.budget.amount,
          }))
        },
      },
    },
  )
}
