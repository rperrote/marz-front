import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { listCampaignParticipants } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignParticipantListResponse,
  ListCampaignParticipantsParams,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export const CAMPAIGN_PARTICIPANTS_STALE_TIME = 30_000

export type CampaignParticipantsParams = Pick<
  ListCampaignParticipantsParams,
  'cursor' | 'limit' | 'search' | 'status' | 'platform'
>

export function campaignParticipantsQueryKey(
  campaignId: string,
  params: CampaignParticipantsParams,
) {
  return ['campaign', campaignId, 'participants', params] as const
}

export function campaignParticipantsQueryOptions(
  campaignId: string,
  params: CampaignParticipantsParams,
) {
  return {
    queryKey: campaignParticipantsQueryKey(campaignId, params),
    queryFn: async (): Promise<CampaignParticipantListResponse> => {
      const response = await listCampaignParticipants(campaignId, params)
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_participants_error',
          'Campaign participants request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_PARTICIPANTS_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignParticipantListResponse, Error>
}

export function useCampaignParticipantsQuery(
  campaignId: string,
  params: CampaignParticipantsParams,
) {
  return useQuery(campaignParticipantsQueryOptions(campaignId, params))
}
