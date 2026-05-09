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
        bonus_pct: 20,
      },
      {
        window_hours: 72,
        bonus_pct: 10,
      },
    ],
  },
  performance_bonus: {
    enabled: true,
    milestones: [
      {
        views: 10000,
        window_hours: 168,
        bonus_pct: 10,
      },
      {
        views: 50000,
        window_hours: 336,
        bonus_pct: 20,
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
            bonus_pct: 101,
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
          path: ['speed_bonus', 'windows', 0, 'bonus_pct'],
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
            bonus_pct: 20,
          },
          {
            window_hours: 24,
            bonus_pct: 10,
          },
        ],
      },
      performance_bonus: {
        enabled: true,
        milestones: [
          {
            views: 10000,
            window_hours: 168,
            bonus_pct: 10,
          },
          {
            views: 10000,
            window_hours: 336,
            bonus_pct: 20,
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
