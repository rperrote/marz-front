import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { getCreatorCampaignBoardDetail } from '#/features/discovery/campaign-board/api/getCreatorCampaignBoardDetail'
import type { CreatorCampaignBoardDetailResponse } from '#/shared/api/generated/model'

export function campaignBoardDetailQueryKey(campaignId: string) {
  return ['discovery', 'campaign-board', 'detail', campaignId] as const
}

type CampaignBoardDetailQueryOptions = Omit<
  UseQueryOptions<CreatorCampaignBoardDetailResponse, Error>,
  'queryKey' | 'queryFn'
>

export function useCampaignBoardDetailQuery(
  campaignId: string,
  options?: CampaignBoardDetailQueryOptions,
) {
  return useQuery({
    queryKey: campaignBoardDetailQueryKey(campaignId),
    queryFn: () => getCreatorCampaignBoardDetail({ data: campaignId }),
    enabled: campaignId.length > 0,
    ...options,
  })
}
