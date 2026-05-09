import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import {
  listCreatorCampaignBoard,
  normalizeCampaignBoardSearch,
} from '#/features/discovery/campaign-board/api/listCreatorCampaignBoard'
import type {
  CreatorCampaignBoardResponse,
  ListCreatorCampaignBoardParams,
} from '#/shared/api/generated/model'

export function campaignBoardQueryKey(search?: ListCreatorCampaignBoardParams) {
  return [
    'discovery',
    'campaign-board',
    normalizeCampaignBoardSearch(search),
  ] as const
}

type CampaignBoardQueryOptions = Omit<
  UseQueryOptions<CreatorCampaignBoardResponse, Error>,
  'queryKey' | 'queryFn'
>

export function useCampaignBoardQuery(
  search?: ListCreatorCampaignBoardParams,
  options?: CampaignBoardQueryOptions,
) {
  const normalizedSearch = normalizeCampaignBoardSearch(search)

  return useQuery({
    queryKey: campaignBoardQueryKey(normalizedSearch),
    queryFn: () => listCreatorCampaignBoard({ data: normalizedSearch }),
    ...options,
  })
}
