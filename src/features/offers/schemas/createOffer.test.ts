import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  bonusAmountSchema,
  createOfferSchema,
  getMinimumTentativePublishDateUTC,
} from './createOffer'

const uuid = '018f9b3f-2394-7a08-9cb8-b4bd3b8d0e12'

function createValidOfferInput() {
  return {
    campaign_id: uuid,
    creator_account_id: uuid,
    offer_mode: 'same_content' as const,
    amount: 100,
    tentative_publish_date: '2026-05-19',
    offer_deadline: '2026-05-19',
    platforms: ['instagram'] as const,
    bonus_terms: {
      speed_bonus_windows: [
        {
          window_hours: 24,
          bonus_pct: '10',
        },
      ],
    },
  }
}

describe('createOfferSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates the tentative publish date floor in UTC', () => {
    vi.setSystemTime(new Date('2026-05-15T23:30:00-03:00'))

    expect(getMinimumTentativePublishDateUTC()).toBe('2026-05-20')
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        tentative_publish_date: '2026-05-19',
        offer_deadline: '2026-05-19',
      }).success,
    ).toBe(false)
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        tentative_publish_date: '2026-05-20',
        offer_deadline: '2026-05-20',
      }).success,
    ).toBe(true)
  })

  it('validates generated bonus_pct decimal string boundaries', () => {
    expect(bonusAmountSchema.safeParse('100').success).toBe(true)
    expect(bonusAmountSchema.safeParse('0').success).toBe(true)
    expect(bonusAmountSchema.safeParse('10.25').success).toBe(true)
    expect(bonusAmountSchema.safeParse('-1').success).toBe(false)
    expect(bonusAmountSchema.safeParse('10.123').success).toBe(false)
    expect(bonusAmountSchema.safeParse('abc').success).toBe(false)
  })

  it('validates speed bonus window hour boundaries', () => {
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        bonus_terms: {
          speed_bonus_windows: [{ window_hours: 720, bonus_pct: '10' }],
        },
      }).success,
    ).toBe(true)
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        bonus_terms: {
          speed_bonus_windows: [{ window_hours: 721, bonus_pct: '10' }],
        },
      }).success,
    ).toBe(false)
  })

  it('rejects speed bonus windows for per-platform offers', () => {
    const result = createOfferSchema.safeParse({
      ...createValidOfferInput(),
      offer_mode: 'per_platform',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['bonus_terms', 'speed_bonus_windows'],
          }),
        ]),
      )
    }
  })

  it('rejects duplicate platforms', () => {
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        platforms: ['instagram', 'instagram'],
      }).success,
    ).toBe(false)
  })

  it('rejects deadlines before the tentative publish date', () => {
    expect(
      createOfferSchema.safeParse({
        ...createValidOfferInput(),
        tentative_publish_date: '2026-05-20',
        offer_deadline: '2026-05-19',
      }).success,
    ).toBe(false)
  })
})
