import { describe, expect, it } from 'vitest'

import { CampaignBoardSearchSchema } from './search-schema'

describe('CampaignBoardSearchSchema', () => {
  it('normalizes default search params', () => {
    expect(CampaignBoardSearchSchema.parse({})).toEqual({
      recommended_only: false,
      sort: 'match_score_desc',
    })
  })

  it('coerces supported query string values', () => {
    expect(
      CampaignBoardSearchSchema.parse({
        q: ' skincare ',
        niches: 'beauty',
        interests: ['makeup', 'wellness'],
        platforms: 'instagram',
        deliverables: ['reel'],
        fee_min_amount: '100.00',
        fee_max_amount: '250',
        min_match_score: '75',
        recommended_only: 'true',
        sort: 'fee_desc',
        cursor: ' next-page ',
      }),
    ).toEqual({
      q: 'skincare',
      niches: ['beauty'],
      interests: ['makeup', 'wellness'],
      platforms: ['instagram'],
      deliverables: ['reel'],
      fee_min_amount: '100.00',
      fee_max_amount: '250',
      min_match_score: 75,
      recommended_only: true,
      sort: 'fee_desc',
      cursor: 'next-page',
    })
  })

  it('rejects invalid search params', () => {
    expect(() =>
      CampaignBoardSearchSchema.parse({ platforms: ['facebook'] }),
    ).toThrow()
    expect(() =>
      CampaignBoardSearchSchema.parse({ recommended_only: 'yes' }),
    ).toThrow()
    expect(() =>
      CampaignBoardSearchSchema.parse({ min_match_score: 'high' }),
    ).toThrow()
    expect(() =>
      CampaignBoardSearchSchema.parse({
        fee_min_amount: '500',
        fee_max_amount: '100',
      }),
    ).toThrow()
    expect(() =>
      CampaignBoardSearchSchema.parse({ niches: { value: 'beauty' } }),
    ).toThrow()
  })
})
