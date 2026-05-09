import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { getCampaignVideos } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignVideoListResponse,
  GetCampaignVideosParams,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export const CAMPAIGN_VIDEOS_STALE_TIME = 30_000

export type CampaignVideosParams = Pick<
  GetCampaignVideosParams,
  'cursor' | 'limit' | 'search' | 'status' | 'platform' | 'creator_account_id'
>

export function campaignVideosQueryKey(
  campaignId: string,
  params: CampaignVideosParams,
) {
  return ['campaign', campaignId, 'videos', params] as const
}

export function campaignVideosQueryOptions(
  campaignId: string,
  params: CampaignVideosParams,
) {
  return {
    queryKey: campaignVideosQueryKey(campaignId, params),
    queryFn: async (): Promise<CampaignVideoListResponse> => {
      const response = await getCampaignVideos(campaignId, params)
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_videos_error',
          'Campaign videos request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_VIDEOS_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignVideoListResponse, Error>
}

export function useCampaignVideosQuery(
  campaignId: string,
  params: CampaignVideosParams,
) {
  return useQuery(campaignVideosQueryOptions(campaignId, params))
}
