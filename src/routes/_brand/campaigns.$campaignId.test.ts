import { describe, expect, it, vi } from 'vitest'

import { campaignDetailSearchSchema } from './campaigns.$campaignId'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('campaign detail search schema', () => {
  it('defaults to overview when tab is missing', () => {
    expect(campaignDetailSearchSchema.parse({})).toMatchObject({
      tab: 'overview',
    })
  })

  it('falls back to overview when tab is invalid', () => {
    expect(campaignDetailSearchSchema.parse({ tab: 'bad-tab' })).toMatchObject({
      tab: 'overview',
    })
  })

  it('keeps optional filter params', () => {
    expect(
      campaignDetailSearchSchema.parse({
        tab: 'discovery',
        section: 'matches',
        q: 'aria',
        status: 'active',
        platform: 'instagram',
        creator_account_id: 'creator-1',
        sort: 'score',
      }),
    ).toEqual({
      tab: 'discovery',
      section: 'matches',
      q: 'aria',
      status: 'active',
      platform: 'instagram',
      creator_account_id: 'creator-1',
      sort: 'score',
    })
  })

  it('drops invalid creator filter values', () => {
    expect(
      campaignDetailSearchSchema.parse({
        tab: 'creators',
        status: 'unknown',
        platform: 'threads',
      }),
    ).toMatchObject({
      tab: 'creators',
      status: undefined,
      platform: undefined,
    })
  })

  it('keeps deliverable status values for videos', () => {
    expect(
      campaignDetailSearchSchema.parse({
        tab: 'videos',
        status: 'draft_submitted',
      }),
    ).toMatchObject({
      tab: 'videos',
      status: 'draft_submitted',
    })
  })

  it('defaults discovery section to matches', () => {
    expect(
      campaignDetailSearchSchema.parse({ tab: 'discovery' }),
    ).toMatchObject({
      section: 'matches',
    })
  })

  it('accepts the active discovery section', () => {
    expect(
      campaignDetailSearchSchema.parse({
        tab: 'discovery',
        section: 'active',
      }),
    ).toMatchObject({
      section: 'active',
    })
  })
})
