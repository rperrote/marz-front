import { describe, expect, it, vi } from 'vitest'
import { useInfiniteQuery } from '@tanstack/react-query'

import {
  getCampaignDiscoveryQueryKey,
  normalizeDiscoverySort,
  toMatchSortParam,
  useCampaignMatchesQuery,
} from './queries'

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => ({})),
  useQuery: vi.fn(() => ({})),
}))

describe('discovery campaign detail queries', () => {
  it('uses hierarchical query keys with params', () => {
    expect(
      getCampaignDiscoveryQueryKey('campaign-1', 'matches', {
        sort: 'followers',
      }),
    ).toEqual([
      'campaign',
      'campaign-1',
      'discovery',
      'matches',
      { sort: 'followers' },
    ])
  })

  it('normalizes unknown match sort values to match score', () => {
    expect(normalizeDiscoverySort(undefined)).toBe('match_score')
    expect(normalizeDiscoverySort('bad-sort')).toBe('match_score')
    expect(normalizeDiscoverySort('followers')).toBe('followers')
  })

  it('preserves sort only for the matches section', () => {
    expect(normalizeDiscoverySort('followers', 'matches')).toBe('followers')
    expect(normalizeDiscoverySort('followers', 'applications')).toBeUndefined()
    expect(normalizeDiscoverySort('followers', 'invited')).toBeUndefined()
    expect(normalizeDiscoverySort('followers', 'active')).toBeUndefined()
  })

  it('maps URL sort values to API sort values', () => {
    expect(toMatchSortParam('match_score')).toBe('match_score')
    expect(toMatchSortParam('followers')).toBe('followers')
    expect(toMatchSortParam('fee')).toBe('fee_amount')
    expect(toMatchSortParam('engagement')).toBe('engagement_pct')
  })

  it('disables campaign matches query when matches cannot be viewed', () => {
    useCampaignMatchesQuery({
      campaignId: 'campaign-1',
      sort: 'match_score',
      enabled: false,
    })

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    )
  })
})
