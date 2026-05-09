import { describe, expect, it } from 'vitest'

import type { CreatorCampaignBoardResponse } from '#/shared/api/generated/model'

import type { CampaignBoardSearch } from '../search-schema'
import {
  activeFilterTypes,
  classifyEmptyState,
  hasAppliedFilters,
} from './classifyEmptyState'

const defaultSearch: CampaignBoardSearch = {
  recommended_only: false,
  sort: 'match_score_desc',
}

function makeResponse(
  counts: CreatorCampaignBoardResponse['counts'],
  dataLength = counts.matching_filters,
): CreatorCampaignBoardResponse {
  return {
    data: Array.from({ length: dataLength }, (_, index) => ({
      campaign_id: `campaign-${index}`,
    })) as CreatorCampaignBoardResponse['data'],
    counts,
    filters: {
      applied: {
        recommended_only: false,
      },
      available: {
        niches: [],
        interests: [],
        platforms: [],
        deliverables: [],
        match_score_min: 0,
        match_score_max: 100,
      },
    },
    next_cursor: null,
    generated_at: '2026-05-09T08:00:00.000Z',
  }
}

describe('classifyEmptyState', () => {
  it('returns error before inspecting data', () => {
    expect(
      classifyEmptyState({
        data: makeResponse({
          total_visible: 0,
          recommended: 0,
          matching_filters: 0,
        }),
        search: defaultSearch,
        error: true,
      }),
    ).toBe('error')
  })

  it('returns null while data is unavailable and no error happened', () => {
    expect(
      classifyEmptyState({
        search: defaultSearch,
        error: false,
      }),
    ).toBeNull()
  })

  it('returns no_campaigns when there are no visible campaigns', () => {
    expect(
      classifyEmptyState({
        data: makeResponse({
          total_visible: 0,
          recommended: 0,
          matching_filters: 0,
        }),
        search: { ...defaultSearch, recommended_only: true },
        error: false,
      }),
    ).toBe('no_campaigns')
  })

  it('returns no_recommendations when recommended-only has no candidates but the board has visible campaigns', () => {
    expect(
      classifyEmptyState({
        data: makeResponse({
          total_visible: 3,
          recommended: 0,
          matching_filters: 0,
        }),
        search: { ...defaultSearch, recommended_only: true },
        error: false,
      }),
    ).toBe('no_recommendations')
  })

  it('returns no_filters when applied filters remove all visible campaigns', () => {
    expect(
      classifyEmptyState({
        data: makeResponse({
          total_visible: 3,
          recommended: 1,
          matching_filters: 0,
        }),
        search: { ...defaultSearch, q: 'auriculares' },
        error: false,
      }),
    ).toBe('no_filters')
  })

  it('returns null when matching data is present', () => {
    expect(
      classifyEmptyState({
        data: makeResponse({
          total_visible: 3,
          recommended: 1,
          matching_filters: 1,
        }),
        search: defaultSearch,
        error: false,
      }),
    ).toBeNull()
  })
})

describe('filter helpers', () => {
  it('ignores default sort when checking applied filters', () => {
    expect(hasAppliedFilters(defaultSearch)).toBe(false)
  })

  it('tracks non-default filter types', () => {
    const search: CampaignBoardSearch = {
      ...defaultSearch,
      niches: ['tech'],
      recommended_only: true,
    }

    expect(hasAppliedFilters(search)).toBe(true)
    expect(activeFilterTypes(search)).toEqual(['niches', 'recommended_only'])
  })
})
