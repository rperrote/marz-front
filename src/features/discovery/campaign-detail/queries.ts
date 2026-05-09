import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import {
  getCampaignDiscoverySummary,
  listCampaignDiscoveryActive,
  listCampaignDiscoveryApplications,
  listCampaignDiscoveryInvites,
  listCampaignDiscoveryMatches,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignActiveListResponse,
  CampaignApplicationListResponse,
  CampaignDiscoverySummaryResponse,
  CampaignInviteListResponse,
  CampaignMatchListResponse,
  ListCampaignDiscoveryActiveParams,
  ListCampaignDiscoveryApplicationsParams,
  ListCampaignDiscoveryInvitesParams,
  ListCampaignDiscoveryMatchesParams,
  ListCampaignDiscoveryMatchesSort,
} from '#/shared/api/generated/model'

export type DiscoverySection = 'matches' | 'applications' | 'active' | 'invited'
export type DiscoverySort = 'match_score' | 'followers' | 'fee' | 'engagement'

const DEFAULT_LIMIT = 12

export function getCampaignDiscoveryQueryKey(
  campaignId: string,
  section: DiscoverySection | 'summary',
  params?: Record<string, unknown>,
) {
  return ['campaign', campaignId, 'discovery', section, params ?? {}] as const
}

export function normalizeDiscoverySort(
  sort: string | undefined,
  section: DiscoverySection = 'matches',
): DiscoverySort | undefined {
  if (section !== 'matches') {
    return undefined
  }
  if (isDiscoverySort(sort)) {
    return sort
  }
  return 'match_score'
}

export function isDiscoverySort(
  sort: string | undefined,
): sort is DiscoverySort {
  return (
    sort === 'match_score' ||
    sort === 'followers' ||
    sort === 'fee' ||
    sort === 'engagement'
  )
}

export function toMatchSortParam(
  sort: DiscoverySort,
): ListCampaignDiscoveryMatchesSort {
  if (sort === 'fee') return 'fee_amount'
  if (sort === 'engagement') return 'engagement_pct'
  return sort
}

export function useCampaignDiscoverySummaryQuery(campaignId: string) {
  return useQuery({
    queryKey: getCampaignDiscoveryQueryKey(campaignId, 'summary'),
    queryFn: async ({ signal }) => {
      const response = await getCampaignDiscoverySummary(campaignId, { signal })
      if (response.status !== 200) {
        throw new Error('Campaign discovery summary failed')
      }
      return response.data
    },
  })
}

export function useCampaignMatchesQuery({
  campaignId,
  sort,
  enabled,
}: {
  campaignId: string
  sort: DiscoverySort
  enabled: boolean
}) {
  const params = {
    limit: DEFAULT_LIMIT,
    sort: toMatchSortParam(sort),
    direction: 'desc',
  } satisfies ListCampaignDiscoveryMatchesParams

  return useInfiniteQuery({
    queryKey: getCampaignDiscoveryQueryKey(campaignId, 'matches', params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignDiscoveryMatches(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign discovery matches failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignMatchListResponse) =>
      lastPage.next_cursor ?? undefined,
    enabled,
  })
}

export function useCampaignApplicationsQuery(campaignId: string) {
  const params = {
    limit: DEFAULT_LIMIT,
  } satisfies ListCampaignDiscoveryApplicationsParams

  return useInfiniteQuery({
    queryKey: getCampaignDiscoveryQueryKey(campaignId, 'applications', params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignDiscoveryApplications(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign discovery applications failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignApplicationListResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}

export function useCampaignInvitesQuery(campaignId: string) {
  const params = {
    limit: DEFAULT_LIMIT,
  } satisfies ListCampaignDiscoveryInvitesParams

  return useInfiniteQuery({
    queryKey: getCampaignDiscoveryQueryKey(campaignId, 'invited', params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignDiscoveryInvites(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign discovery invites failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignInviteListResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}

export function useCampaignActiveQuery(campaignId: string) {
  const params = {
    limit: DEFAULT_LIMIT,
  } satisfies ListCampaignDiscoveryActiveParams

  return useInfiniteQuery({
    queryKey: getCampaignDiscoveryQueryKey(campaignId, 'active', params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignDiscoveryActive(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign discovery active failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignActiveListResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}

export type { CampaignDiscoverySummaryResponse }
