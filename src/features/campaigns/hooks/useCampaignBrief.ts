import { useQuery } from '@tanstack/react-query'
import {
  getCampaignBrief,
  getGetCampaignBriefQueryKey,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  BriefHardFilter,
  BriefScoringDimension,
  CampaignBriefResponse,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import type {
  BriefDraft,
  Gender,
  HardFilter,
  Platform,
  ScoringDimension,
} from '../brief-builder/store'

function fromApiHardFilter(filter: BriefHardFilter, index: number): HardFilter {
  return {
    id: `hf-${index}`,
    filter_type: filter.field,
    filter_value: filter.value,
  }
}

function fromApiScoringDimension(
  dimension: BriefScoringDimension,
  index: number,
): ScoringDimension {
  return {
    id: `sd-${index}`,
    name: dimension.name,
    description: '',
    weight_pct: dimension.weight_pct,
    positive_signals: [],
    negative_signals: [],
  }
}

function toBriefDraft(response: CampaignBriefResponse): BriefDraft {
  return {
    campaign: {
      name: '',
      objective: '',
      budget_amount: null,
      budget_currency: '',
      deadline: '',
    },
    brief: {
      icp_description: response.icp_description ?? null,
      icp_age_min: response.icp_age_min ?? null,
      icp_age_max: response.icp_age_max ?? null,
      icp_genders: (response.icp_genders ?? []) as Gender[],
      icp_countries: response.icp_countries ?? [],
      icp_platforms: (response.icp_platforms ?? []) as Platform[],
      icp_interests: response.icp_interests ?? [],
      scoring_dimensions: response.scoring_dimensions.map(
        fromApiScoringDimension,
      ),
      hard_filters: response.hard_filters.map(fromApiHardFilter),
      disqualifiers: response.disqualifiers ?? [],
    },
  }
}

export interface CampaignBrief {
  campaignId: string
  draft: BriefDraft
}

function campaignBriefQueryKey(campaignId: string) {
  return getGetCampaignBriefQueryKey(campaignId)
}

export function useCampaignBrief(campaignId: string) {
  return useQuery({
    queryKey: campaignBriefQueryKey(campaignId),
    queryFn: async (): Promise<CampaignBrief> => {
      const response = (await getCampaignBrief(campaignId)) as {
        data: CampaignBriefResponse
      }
      return {
        campaignId: response.data.campaign_id,
        draft: toBriefDraft(response.data),
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  })
}
