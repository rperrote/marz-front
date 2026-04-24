import { describe, it, expect } from 'vitest'
import { STEPS, getStepIndex, getStepId } from './steps'
import type { BrandOnboardingState } from './store'

function makeState(
  partial: Partial<BrandOnboardingState> = {},
): BrandOnboardingState {
  return {
    currentStepIndex: 0,
    setField: () => {},
    goTo: () => {},
    reset: () => {},
    ...partial,
  }
}

describe('STEPS', () => {
  it('has 14 steps', () => {
    expect(STEPS).toHaveLength(14)
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
    expect(getStepIndex('identity')).toBe(0)
    expect(getStepIndex('vertical')).toBe(1)
    expect(getStepIndex('confirmation')).toBe(13)
  })

  it('returns -1 for unknown id', () => {
    expect(getStepIndex('foobar')).toBe(-1)
    expect(getStepIndex('')).toBe(-1)
  })
})

describe('getStepId', () => {
  it('returns correct id for valid indices', () => {
    expect(getStepId(0)).toBe('identity')
    expect(getStepId(13)).toBe('confirmation')
  })

  it('clamps out-of-range indices', () => {
    expect(getStepId(-5)).toBe('identity')
    expect(getStepId(100)).toBe('confirmation')
  })
})

describe('validate functions', () => {
  it('B1 identity: requires non-empty name', () => {
    const validate = STEPS[0]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ name: '' }))).toBe(false)
    expect(validate(makeState({ name: '  ' }))).toBe(false)
    expect(validate(makeState({ name: 'Acme' }))).toBe(true)
  })

  it('B2 vertical: requires non-empty string', () => {
    const validate = STEPS[1]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ vertical: 'fintech' }))).toBe(true)
  })

  it('B3 priming-social: no validation', () => {
    expect(STEPS[2]!.validate).toBeUndefined()
  })

  it('B4 objective: requires non-empty string', () => {
    const validate = STEPS[3]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ marketing_objective: 'awareness' }))).toBe(true)
  })

  it('B5 experience: requires both experience and sourcing', () => {
    const validate = STEPS[4]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ creator_experience: 'never' }))).toBe(false)
    expect(
      validate(
        makeState({
          creator_experience: 'never',
          creator_sourcing_history: 'none',
        }),
      ),
    ).toBe(true)
  })

  it('B6 budget: requires non-empty string', () => {
    const validate = STEPS[5]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ monthly_budget_range: 'under_10k' }))).toBe(
      true,
    )
  })

  it('B7 priming-match: no validation', () => {
    expect(STEPS[6]!.validate).toBeUndefined()
  })

  it('B8 timing: requires non-empty string', () => {
    const validate = STEPS[7]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ timing: 'launch_now' }))).toBe(true)
  })

  it('B9 contact: requires name, title, and E.164 whatsapp', () => {
    const validate = STEPS[8]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(
      validate(
        makeState({
          contact_name: 'John',
          contact_title: 'CEO',
          contact_whatsapp_e164: '12345',
        }),
      ),
    ).toBe(false)
    expect(
      validate(
        makeState({
          contact_name: 'John',
          contact_title: 'CEO',
          contact_whatsapp_e164: '+5491155550000',
        }),
      ),
    ).toBe(true)
  })

  it('B10 priming-projection: no validation', () => {
    expect(STEPS[9]!.validate).toBeUndefined()
  })

  it('B11 attribution: requires source; referral requires text', () => {
    const validate = STEPS[10]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ attribution: { source: 'instagram' } }))).toBe(
      true,
    )
    expect(
      validate(
        makeState({
          attribution: { source: 'referral', referral_text: '' },
        }),
      ),
    ).toBe(false)
    expect(
      validate(
        makeState({
          attribution: { source: 'referral', referral_text: 'friend' },
        }),
      ),
    ).toBe(true)
  })

  it('B12 loading: no validation', () => {
    expect(STEPS[11]!.validate).toBeUndefined()
  })

  it('B13 paywall: no validation', () => {
    expect(STEPS[12]!.validate).toBeUndefined()
  })

  it('B14 confirmation: no validation', () => {
    expect(STEPS[13]!.validate).toBeUndefined()
  })
})
