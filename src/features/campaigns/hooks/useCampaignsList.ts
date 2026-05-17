import type { CampaignConfigurationStep } from '#/features/campaigns/configuration/hooks'
import {
  getListCampaignsQueryKey,
  useListCampaigns,
} from '#/shared/api/generated/campaigns/campaigns'
import type { CampaignListItem as GeneratedCampaignListItem } from '#/shared/api/generated/model'

export type CampaignListItem = {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate: string | null
  platforms: string[]
  creators: number
  budget: string
  videos: {
    done: number
    total: number
  }
  configurationComplete: boolean | null
  configurationCurrentStep: CampaignConfigurationStep | null
}

export function getCampaignsListQueryKey() {
  return getListCampaignsQueryKey()
}

export function useCampaignsList() {
  return useListCampaigns(undefined, {
    query: {
      select: (response): CampaignListItem[] => {
        if (response.status !== 200) return []
        return response.data.data.map(mapCampaignListItem)
      },
    },
  })
}

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

type CampaignListItemWithConfiguration = GeneratedCampaignListItem & {
  configuration_complete?: boolean | null
  configuration_current_step?: CampaignConfigurationStep | null
}

function mapCampaignListItem(raw: GeneratedCampaignListItem): CampaignListItem {
  const campaign = raw as CampaignListItemWithConfiguration

  return {
    id: campaign.campaign_id,
    name: campaign.name,
    status: campaign.status,
    startDate: campaign.deadline ?? null,
    platforms: [],
    creators: 0,
    budget: formatBudget(campaign.budget.amount, campaign.budget.currency),
    videos: { done: 0, total: 0 },
    configurationComplete: campaign.configuration_complete ?? null,
    configurationCurrentStep: campaign.configuration_current_step ?? null,
  }
}

function formatBudget(amount: string, currency = 'USD'): string {
  const numericAmount = Number.parseFloat(amount)
  if (!Number.isFinite(numericAmount)) return amount

  if (currency !== 'USD')
    return `${currency} ${numericAmount.toLocaleString('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    })}`
  return compactUsdFormatter.format(numericAmount)
}
