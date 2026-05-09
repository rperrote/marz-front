import { describe, expect, it } from 'vitest'

import { getInboxQueryKey } from './api/inbox'
import { inboxSearchSchema } from './inboxSearchSchema'

const campaignId = '018f2f3a-1f2b-7c8d-9e0f-123456789abc'

describe('inboxSearchSchema', () => {
  it('accepts a valid campaign_id uuid', () => {
    expect(inboxSearchSchema.parse({ campaign_id: campaignId })).toEqual({
      campaign_id: campaignId,
    })
  })

  it('keeps campaign_id optional', () => {
    expect(inboxSearchSchema.parse({})).toEqual({})
  })

  it('drops invalid campaign_id values', () => {
    expect(inboxSearchSchema.parse({ campaign_id: 'not-a-uuid' })).toEqual({
      campaign_id: undefined,
    })
  })
})

describe('getInboxQueryKey', () => {
  it('uses the canonical inbox key with null campaign fallback', () => {
    expect(getInboxQueryKey()).toEqual(['inbox', null])
    expect(getInboxQueryKey(null)).toEqual(['inbox', null])
  })

  it('includes campaign id when present', () => {
    expect(getInboxQueryKey(campaignId)).toEqual(['inbox', campaignId])
  })
})
