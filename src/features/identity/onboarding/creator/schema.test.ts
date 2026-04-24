import { describe, expect, it } from 'vitest'
import { CreatorOnboardingPayloadSchema } from './schema'
import type { CreatorOnboardingPayload } from '#/shared/api/generated/model/creatorOnboardingPayload'

function validPayload(): CreatorOnboardingPayload {
  return {
    handle: 'test_creator',
    display_name: 'Test Creator',
    niches: ['fashion', 'beauty'],
    content_types: ['short_video'],
    country: 'AR',
    avatar_s3_key: 'avatars/abc.jpg',
    birthday: '1995-06-15',
    whatsapp_e164: '+5491155555555',
    experience_level: 'none',
    tier: 'growing',
    channels: [
      {
        platform: 'instagram',
        external_handle: '@test',
        verified: false,
        is_primary: true,
        rate_cards: [
          { format: 'ig_reel', rate_amount: '100.00', rate_currency: 'USD' },
        ],
      },
    ],
    best_videos: [
      { url: 'https://example.com/1', kind: 'organic' },
      { url: 'https://example.com/2', kind: 'branded' },
      { url: 'https://example.com/3', kind: 'organic' },
    ],
  }
}

describe('CreatorOnboardingPayloadSchema', () => {
  it('accepts a valid payload', () => {
    const result = CreatorOnboardingPayloadSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it('rejects 2 primary channels', () => {
    const payload = validPayload()
    payload.channels = [
      {
        platform: 'instagram',
        external_handle: '@ig',
        verified: false,
        is_primary: true,
        rate_cards: [],
      },
      {
        platform: 'tiktok',
        external_handle: '@tt',
        verified: false,
        is_primary: true,
        rate_cards: [],
      },
    ]
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      const channelsIssue = result.error.issues.find(
        (i) => i.path[0] === 'channels',
      )
      expect(channelsIssue).toBeDefined()
      expect(channelsIssue!.message).toBe('exactly_one_primary_required')
    }
  })

  it('rejects duplicate rate card formats in a channel', () => {
    const payload = validPayload()
    payload.channels = [
      {
        platform: 'instagram',
        external_handle: '@ig',
        verified: false,
        is_primary: true,
        rate_cards: [
          { format: 'ig_reel', rate_amount: '100.00', rate_currency: 'USD' },
          { format: 'ig_reel', rate_amount: '200.00', rate_currency: 'USD' },
        ],
      },
    ]
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatIssue = result.error.issues.find(
        (i) =>
          i.path[0] === 'channels' &&
          i.path[2] === 'rate_cards' &&
          i.path[4] === 'format',
      )
      expect(formatIssue).toBeDefined()
      expect(formatIssue!.message).toBe('duplicate_format_in_channel')
    }
  })

  it('rejects fewer than 3 best_videos', () => {
    const payload = validPayload()
    payload.best_videos = [
      { url: 'https://example.com/1', kind: 'organic' },
      { url: 'https://example.com/2', kind: 'organic' },
    ]
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects niches > 5', () => {
    const payload = validPayload()
    payload.niches = ['a', 'b', 'c', 'd', 'e', 'f']
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects format not valid for platform', () => {
    const payload = validPayload()
    payload.channels = [
      {
        platform: 'tiktok',
        external_handle: '@tt',
        verified: false,
        is_primary: true,
        rate_cards: [
          { format: 'ig_reel', rate_amount: '50.00', rate_currency: 'USD' },
        ],
      },
    ]
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.message === 'format_not_valid_for_platform',
      )
      expect(issue).toBeDefined()
    }
  })

  it('rejects zero channels', () => {
    const payload = validPayload()
    payload.channels = []
    const result = CreatorOnboardingPayloadSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
