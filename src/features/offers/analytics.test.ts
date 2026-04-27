import { describe, it, expect, vi, beforeEach } from 'vitest'
import { customFetch } from '#/shared/api/mutator'
import {
  trackOfferEvent,
  toAmountBucket,
  toArchiveSizeBucket,
  markOfferSeen,
  resetSeenOffers,
  daysFromNow,
} from './analytics'

vi.mock('#/shared/api/mutator', () => ({
  customFetch: vi.fn().mockResolvedValue(undefined),
}))

const mockFetch = vi.mocked(customFetch)

beforeEach(() => {
  vi.clearAllMocks()
  resetSeenOffers()
})

function getLastFetchBody() {
  const body = mockFetch.mock.calls[0]![1]!.body as string
  return JSON.parse(body)
}

describe('trackOfferEvent — offer_sidesheet_opened', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_sidesheet_opened', {
      actor_kind: 'brand',
      source: 'conversation',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const body = getLastFetchBody()
    expect(body.event).toBe('offer_sidesheet_opened')
    expect(body.properties.actor_kind).toBe('brand')
    expect(body.properties.source).toBe('conversation')
    expect(body.timestamp).toBeTypeOf('string')
  })
})

describe('trackOfferEvent — offer_sent', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_sent', {
      actor_kind: 'brand',
      offer_type: 'single',
      platform: 'instagram',
      has_speed_bonus: false,
      amount_bucket: '<500',
      deadline_days_from_now: 7,
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_sent')
    expect(body.properties.actor_kind).toBe('brand')
    expect(body.properties.offer_type).toBe('single')
    expect(body.properties.platform).toBe('instagram')
    expect(body.properties.has_speed_bonus).toBe(false)
    expect(body.properties.amount_bucket).toBe('<500')
    expect(body.properties.deadline_days_from_now).toBe(7)
  })

  it('does not throw when customFetch fails', () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    expect(() =>
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'single',
        platform: 'instagram',
        has_speed_bonus: false,
        amount_bucket: '<500',
        deadline_days_from_now: 7,
      }),
    ).not.toThrow()
  })
})

describe('trackOfferEvent — offer_received_seen', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_received_seen', {
      actor_kind: 'creator',
      offer_age_seconds: 42,
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_received_seen')
    expect(body.properties.actor_kind).toBe('creator')
    expect(body.properties.offer_age_seconds).toBe(42)
  })
})

describe('trackOfferEvent — offer_accepted', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_accepted', {
      actor_kind: 'creator',
      time_to_response_seconds: 3600,
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_accepted')
    expect(body.properties.actor_kind).toBe('creator')
    expect(body.properties.time_to_response_seconds).toBe(3600)
  })
})

describe('trackOfferEvent — offer_rejected', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_rejected', {
      actor_kind: 'creator',
      time_to_response_seconds: 1800,
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_rejected')
    expect(body.properties.actor_kind).toBe('creator')
    expect(body.properties.time_to_response_seconds).toBe(1800)
  })
})

describe('trackOfferEvent — offer_panel_viewed', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_panel_viewed', {
      actor_kind: 'brand',
      offer_state: 'sent',
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_panel_viewed')
    expect(body.properties.actor_kind).toBe('brand')
    expect(body.properties.offer_state).toBe('sent')
  })
})

describe('trackOfferEvent — offer_archive_expanded', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_archive_expanded', {
      actor_kind: 'creator',
      archive_size_bucket: '5-10',
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_archive_expanded')
    expect(body.properties.actor_kind).toBe('creator')
    expect(body.properties.archive_size_bucket).toBe('5-10')
  })
})

describe('trackOfferEvent — offer_expired_seen', () => {
  it('sends correct payload', () => {
    trackOfferEvent('offer_expired_seen', {
      actor_kind: 'brand',
      offer_age_days_at_seen: 3,
    })

    const body = getLastFetchBody()
    expect(body.event).toBe('offer_expired_seen')
    expect(body.properties.actor_kind).toBe('brand')
    expect(body.properties.offer_age_days_at_seen).toBe(3)
  })
})

describe('toAmountBucket', () => {
  it.each([
    [0, 'USD', '<500'],
    [499.99, 'USD', '<500'],
    [500, 'USD', '500-1000'],
    [1000, 'USD', '1000-2500'],
    [2500, 'USD', '2500-5000'],
    [5000, 'USD', '5000-10000'],
    [10000, 'USD', '>10000'],
    [15000, 'EUR', '>10000'],
  ])('maps %s %s to %s', (amount, currency, expected) => {
    expect(toAmountBucket(amount, currency)).toBe(expected)
  })
})

describe('toArchiveSizeBucket', () => {
  it.each([
    [0, '<5'],
    [4, '<5'],
    [5, '5-10'],
    [10, '10-20'],
    [20, '20-50'],
    [50, '>50'],
    [100, '>50'],
  ])('maps %s to %s', (size, expected) => {
    expect(toArchiveSizeBucket(size)).toBe(expected)
  })
})

describe('markOfferSeen', () => {
  it('returns true on first call for a key', () => {
    expect(markOfferSeen('offer-1', 'offer_received_seen')).toBe(true)
  })

  it('returns false on subsequent calls for the same key', () => {
    markOfferSeen('offer-1', 'offer_received_seen')
    expect(markOfferSeen('offer-1', 'offer_received_seen')).toBe(false)
  })

  it('returns true for a different offerId with same event', () => {
    markOfferSeen('offer-1', 'offer_received_seen')
    expect(markOfferSeen('offer-2', 'offer_received_seen')).toBe(true)
  })

  it('allows the same offerId for a different event', () => {
    markOfferSeen('offer-1', 'offer_received_seen')
    expect(markOfferSeen('offer-1', 'offer_expired_seen')).toBe(true)
  })
})

describe('daysFromNow', () => {
  it('returns 0 for today', () => {
    const now = new Date('2026-04-27T12:00:00Z')
    expect(daysFromNow('2026-04-27', now)).toBe(0)
  })

  it('returns 1 for tomorrow', () => {
    const now = new Date('2026-04-27T12:00:00Z')
    expect(daysFromNow('2026-04-28', now)).toBe(1)
  })

  it('returns 7 for next week', () => {
    const now = new Date('2026-04-27T12:00:00Z')
    expect(daysFromNow('2026-05-04', now)).toBe(7)
  })

  it('handles ISO datetime input', () => {
    const now = new Date('2026-04-27T12:00:00Z')
    expect(daysFromNow('2026-04-27T00:00:00Z', now)).toBe(0)
    expect(daysFromNow('2026-04-28T23:59:59Z', now)).toBe(1)
  })
})
