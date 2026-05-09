import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { getCampaignOverview } from '#/shared/api/generated/campaigns/campaigns'
import type { CampaignOverviewResponse } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export const CAMPAIGN_OVERVIEW_STALE_TIME = 60_000

interface CampaignOverviewQueryOptions {
  activityLimit?: number
}

export function campaignOverviewQueryKey(campaignId: string) {
  return ['campaign', campaignId, 'overview'] as const
}

export function campaignOverviewQueryOptions(
  campaignId: string,
  options: CampaignOverviewQueryOptions = {},
) {
  const activityLimit = options.activityLimit ?? 5

  return {
    queryKey: campaignOverviewQueryKey(campaignId),
    queryFn: async (): Promise<CampaignOverviewResponse> => {
      const response = await getCampaignOverview(campaignId, {
        activity_limit: activityLimit,
      })
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_overview_error',
          'Campaign overview request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_OVERVIEW_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignOverviewResponse, Error>
}

export function useCampaignOverviewQuery(
  campaignId: string,
  options: CampaignOverviewQueryOptions = {},
) {
  return useQuery(campaignOverviewQueryOptions(campaignId, options))
}
