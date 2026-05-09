import type { CreatorCampaignBoardResponse } from '#/shared/api/generated/model'

import type { CampaignBoardSearch } from '../search-schema'

export type CampaignBoardEmptyStateType =
  | 'no_campaigns'
  | 'no_filters'
  | 'no_recommendations'
  | 'error'

interface ClassifyEmptyStateInput {
  data?: CreatorCampaignBoardResponse
  search: CampaignBoardSearch
  error: boolean
}

const filterSearchKeys = [
  'q',
  'niches',
  'interests',
  'platforms',
  'deliverables',
  'fee_min_amount',
  'fee_max_amount',
  'min_match_score',
  'recommended_only',
] satisfies Array<keyof CampaignBoardSearch>

const defaultFilterValues: Partial<CampaignBoardSearch> = {
  recommended_only: false,
}

export function classifyEmptyState({
  data,
  search,
  error,
}: ClassifyEmptyStateInput): CampaignBoardEmptyStateType | null {
  if (error) return 'error'
  if (!data) return null

  const { counts } = data

  if (counts.total_visible === 0) return 'no_campaigns'

  if (search.recommended_only && counts.recommended === 0) {
    return 'no_recommendations'
  }

  if (hasAppliedFilters(search) && counts.matching_filters === 0) {
    return 'no_filters'
  }

  return null
}

export function hasAppliedFilters(search: CampaignBoardSearch): boolean {
  return filterSearchKeys.some((key) => {
    const value = search[key]
    const defaultValue = defaultFilterValues[key]

    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== defaultValue
  })
}

export function activeFilterTypes(search: CampaignBoardSearch): string[] {
  return filterSearchKeys.filter((key) => {
    const value = search[key]
    const defaultValue = defaultFilterValues[key]

    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== defaultValue
  })
}
