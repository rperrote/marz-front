import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { getCampaignDetail } from '#/shared/api/generated/campaigns/campaigns'
import type { CampaignDetailResponse } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export const CAMPAIGN_DETAIL_STALE_TIME = 60_000

export function campaignDetailQueryKey(campaignId: string) {
  return ['campaign', campaignId, 'detail'] as const
}

export function campaignDetailQueryOptions(campaignId: string) {
  return {
    queryKey: campaignDetailQueryKey(campaignId),
    queryFn: async (): Promise<CampaignDetailResponse> => {
      const response = await getCampaignDetail(campaignId)
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_detail_error',
          'Campaign detail request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_DETAIL_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignDetailResponse, Error>
}

export function useCampaignDetailQuery(campaignId: string) {
  return useQuery(campaignDetailQueryOptions(campaignId))
}
