import { describe, it, expect } from 'vitest'
import { STEPS, getStepIndex, getStepId } from './steps'
import type { CreatorOnboardingState } from './store'

function makeState(
  partial: Partial<CreatorOnboardingState> = {},
): CreatorOnboardingState {
  return {
    currentStepIndex: 0,
    fieldErrors: {},
    setField: () => {},
    setFieldErrors: () => {},
    clearFieldErrors: () => {},
    goTo: () => {},
    reset: () => {},
    ...partial,
  }
}

describe('STEPS', () => {
  it('has 21 steps', () => {
    expect(STEPS).toHaveLength(21)
  })

  it('every step has id and component', () => {
    for (const step of STEPS) {
      expect(typeof step.id).toBe('string')
      expect(step.id.length).toBeGreaterThan(0)
      expect(typeof step.component).toBe('function')
    }
  })

  it('has unique ids', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getStepIndex', () => {
  it('returns correct index for valid ids', () => {
    expect(getStepIndex('name-handle')).toBe(0)
    expect(getStepIndex('experience')).toBe(1)
    expect(getStepIndex('confirmation')).toBe(20)
  })

  it('returns -1 for unknown id', () => {
    expect(getStepIndex('foobar')).toBe(-1)
    expect(getStepIndex('')).toBe(-1)
  })
})

describe('getStepId', () => {
  it('returns correct id for valid indices', () => {
    expect(getStepId(0)).toBe('name-handle')
    expect(getStepId(20)).toBe('confirmation')
  })

  it('clamps out-of-range indices', () => {
    expect(getStepId(-5)).toBe('name-handle')
    expect(getStepId(100)).toBe('confirmation')
  })
})

describe('validate functions', () => {
  it('C1 name-handle: requires display_name and valid handle', () => {
    const validate = STEPS[0]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ display_name: '', handle: 'ok_1' }))).toBe(
      false,
    )
    expect(validate(makeState({ display_name: 'Ana', handle: 'AB' }))).toBe(
      false,
    )
    expect(validate(makeState({ display_name: 'Ana', handle: 'ana_1' }))).toBe(
      true,
    )
  })

  it('C2 experience: requires non-empty experience_level', () => {
    const validate = STEPS[1]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ experience_level: 'none' }))).toBe(true)
  })

  it('C3 priming-brands-waiting: no validation', () => {
    expect(STEPS[2]!.validate).toBeUndefined()
  })

  it('C4 tier: requires non-empty tier', () => {
    const validate = STEPS[3]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ tier: 'emergent' }))).toBe(true)
  })

  it('C5 niches: requires 1-5 niches', () => {
    const validate = STEPS[4]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ niches: [] }))).toBe(false)
    expect(validate(makeState({ niches: ['fitness'] }))).toBe(true)
    expect(validate(makeState({ niches: ['a', 'b', 'c', 'd', 'e'] }))).toBe(
      true,
    )
    expect(
      validate(makeState({ niches: ['a', 'b', 'c', 'd', 'e', 'f'] })),
    ).toBe(false)
  })

  it('C6 content-types: requires at least 1', () => {
    const validate = STEPS[5]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ content_types: [] }))).toBe(false)
    expect(validate(makeState({ content_types: ['reels'] }))).toBe(true)
  })

  it('C7 channels: requires >= 1 channel with exactly 1 primary', () => {
    const validate = STEPS[6]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ channels: [] }))).toBe(false)
    const ch = {
      platform: 'instagram',
      external_handle: '@test',
      verified: false,
      is_primary: true,
      rate_cards: [],
    }
    expect(validate(makeState({ channels: [ch] }))).toBe(true)
    expect(
      validate(
        makeState({
          channels: [ch, { ...ch, is_primary: true }],
        }),
      ),
    ).toBe(false)
  })

  it('C8, C8b, C9 primings: no validation', () => {
    expect(STEPS[7]!.validate).toBeUndefined()
    expect(STEPS[8]!.validate).toBeUndefined()
    expect(STEPS[9]!.validate).toBeUndefined()
  })

  it('C10 best-videos: requires exactly 3 with non-empty URLs', () => {
    const validate = STEPS[10]!.validate!
    expect(validate(makeState())).toBe(false)
    const vid = { url: 'https://example.com/v', kind: 'organic' as const }
    expect(validate(makeState({ best_videos: [vid, vid] }))).toBe(false)
    expect(validate(makeState({ best_videos: [vid, vid, vid] }))).toBe(true)
    expect(
      validate(
        makeState({
          best_videos: [vid, vid, { url: '', kind: 'organic' }],
        }),
      ),
    ).toBe(false)
  })

  it('C11 birthday: requires YYYY-MM-DD format', () => {
    const validate = STEPS[11]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ birthday: '2000-01-01' }))).toBe(true)
    expect(validate(makeState({ birthday: '01/01/2000' }))).toBe(false)
  })

  it('C12 gender: no validation (optional)', () => {
    expect(STEPS[12]!.validate).toBeUndefined()
  })

  it('C13 location: requires 2-letter country code', () => {
    const validate = STEPS[13]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ country: 'AR' }))).toBe(true)
    expect(validate(makeState({ country: 'arg' }))).toBe(false)
  })

  it('C14 priming-numbers: no validation', () => {
    expect(STEPS[14]!.validate).toBeUndefined()
  })

  it('C15 whatsapp: requires E.164 format', () => {
    const validate = STEPS[15]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ whatsapp_e164: '+5491155550000' }))).toBe(true)
    expect(validate(makeState({ whatsapp_e164: '12345' }))).toBe(false)
  })

  it('C16 referral: no validation (optional)', () => {
    expect(STEPS[16]!.validate).toBeUndefined()
  })

  it('C17 avatar: requires non-empty avatar_s3_key', () => {
    const validate = STEPS[17]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ avatar_s3_key: '' }))).toBe(false)
    expect(validate(makeState({ avatar_s3_key: 'avatars/123.jpg' }))).toBe(true)
  })

  it('C18 priming-earnings: no validation', () => {
    expect(STEPS[18]!.validate).toBeUndefined()
  })

  it('C19 priming-social-proof: no validation', () => {
    expect(STEPS[19]!.validate).toBeUndefined()
  })

  it('C20 confirmation: no validation', () => {
    expect(STEPS[20]!.validate).toBeUndefined()
  })
})
