import { describe, expect, it } from 'vitest'

import { BonusConfigSchema, OperationalTargetingSchema } from './schemas'

const validOperationalTargeting = {
  countries: ['AR', 'US'],
  tiers: ['emergent', 'growing'],
  follower_min: 1000,
  follower_max: 10000,
  genders: ['female', 'male'],
  age_min: 18,
  age_max: 35,
  interests: ['fashion', 'beauty'],
  content_languages: ['es', 'en'],
  source: 'manual',
  adjusted_from_brief: true,
} as const

const validBonusConfig = {
  enabled: true,
  speed_bonus: {
    enabled: true,
    windows: [
      {
        window_hours: 24,
        bonus: { type: 'percentage', percentage: 20 },
      },
      {
        window_hours: 72,
        bonus: { type: 'fixed', amount: '10.00', currency: 'USD' },
      },
    ],
  },
  performance_bonus: {
    enabled: true,
    milestones: [
      {
        views: 10000,
        window_hours: 168,
        bonus: { type: 'percentage', percentage: 10 },
      },
      {
        views: 50000,
        window_hours: 336,
        bonus: { type: 'fixed', amount: '100.00', currency: 'USD' },
      },
    ],
  },
} as const

describe('OperationalTargetingSchema', () => {
  it('accepts a valid targeting configuration', () => {
    expect(
      OperationalTargetingSchema.safeParse(validOperationalTargeting).success,
    ).toBe(true)
  })

  it('rejects follower_min greater than follower_max', () => {
    const result = OperationalTargetingSchema.safeParse({
      ...validOperationalTargeting,
      follower_min: 20000,
      follower_max: 10000,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['follower_max'] }),
      ]),
    )
  })

  it('rejects age ranges above the allowed maximum', () => {
    const result = OperationalTargetingSchema.safeParse({
      ...validOperationalTargeting,
      age_max: 121,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['age_max'] })]),
    )
  })

  it('rejects age ranges below the allowed minimum', () => {
    const result = OperationalTargetingSchema.safeParse({
      ...validOperationalTargeting,
      age_min: 17,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['age_min'] })]),
    )
  })

  it('rejects non ISO-3166 alpha-2 country codes', () => {
    const result = OperationalTargetingSchema.safeParse({
      ...validOperationalTargeting,
      countries: ['XX'],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['countries', 0] }),
      ]),
    )
  })
})

describe('BonusConfigSchema', () => {
  it('accepts a valid bonus configuration', () => {
    expect(BonusConfigSchema.safeParse(validBonusConfig).success).toBe(true)
  })

  it('rejects invalid bonus percentages and windows', () => {
    const result = BonusConfigSchema.safeParse({
      ...validBonusConfig,
      speed_bonus: {
        enabled: true,
        windows: [
          {
            window_hours: 721,
            bonus: { type: 'percentage', percentage: 101 },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['speed_bonus', 'windows', 0, 'window_hours'],
        }),
        expect.objectContaining({
          path: ['speed_bonus', 'windows', 0, 'bonus', 'percentage'],
        }),
      ]),
    )
  })

  it('rejects fixed bonus amounts that are zero or non-decimal', () => {
    const result = BonusConfigSchema.safeParse({
      ...validBonusConfig,
      speed_bonus: {
        enabled: true,
        windows: [
          {
            window_hours: 24,
            bonus: { type: 'fixed', amount: '0', currency: 'USD' },
          },
          {
            window_hours: 48,
            bonus: { type: 'fixed', amount: '12.345', currency: 'USD' },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['speed_bonus', 'windows', 0, 'bonus', 'amount'],
        }),
        expect.objectContaining({
          path: ['speed_bonus', 'windows', 1, 'bonus', 'amount'],
        }),
      ]),
    )
  })

  it('rejects duplicate speed windows and performance milestones', () => {
    const result = BonusConfigSchema.safeParse({
      ...validBonusConfig,
      speed_bonus: {
        enabled: true,
        windows: [
          {
            window_hours: 24,
            bonus: { type: 'percentage', percentage: 20 },
          },
          {
            window_hours: 24,
            bonus: { type: 'percentage', percentage: 10 },
          },
        ],
      },
      performance_bonus: {
        enabled: true,
        milestones: [
          {
            views: 10000,
            window_hours: 168,
            bonus: { type: 'percentage', percentage: 10 },
          },
          {
            views: 10000,
            window_hours: 336,
            bonus: { type: 'percentage', percentage: 20 },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['speed_bonus', 'windows', 1, 'window_hours'],
        }),
        expect.objectContaining({
          path: ['performance_bonus', 'milestones', 1, 'views'],
        }),
      ]),
    )
  })
})
