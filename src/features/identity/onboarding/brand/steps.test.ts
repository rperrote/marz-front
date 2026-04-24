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
    expect(getStepIndex('name')).toBe(0)
    expect(getStepIndex('review')).toBe(13)
    expect(getStepIndex('vertical')).toBe(3)
  })

  it('returns -1 for unknown id', () => {
    expect(getStepIndex('foobar')).toBe(-1)
    expect(getStepIndex('')).toBe(-1)
  })
})

describe('getStepId', () => {
  it('returns correct id for valid indices', () => {
    expect(getStepId(0)).toBe('name')
    expect(getStepId(13)).toBe('review')
  })

  it('clamps out-of-range indices', () => {
    expect(getStepId(-5)).toBe('name')
    expect(getStepId(100)).toBe('review')
  })
})

describe('validate functions', () => {
  it('name: requires non-empty trimmed string', () => {
    const validate = STEPS[0]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ name: '' }))).toBe(false)
    expect(validate(makeState({ name: '  ' }))).toBe(false)
    expect(validate(makeState({ name: 'Acme' }))).toBe(true)
  })

  it('website: no validation (optional step)', () => {
    expect(STEPS[1]!.validate).toBeUndefined()
  })

  it('colors: no validation (optional step)', () => {
    expect(STEPS[2]!.validate).toBeUndefined()
  })

  it('vertical: requires non-empty string', () => {
    const validate = STEPS[3]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ vertical: 'fintech' }))).toBe(true)
  })

  it('marketing-objective: requires non-empty string', () => {
    const validate = STEPS[4]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ marketing_objective: 'awareness' }))).toBe(true)
  })

  it('creator-experience: requires non-empty string', () => {
    const validate = STEPS[5]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ creator_experience: 'never' }))).toBe(true)
  })

  it('creator-sourcing: requires non-empty string', () => {
    const validate = STEPS[6]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ creator_sourcing_history: 'none' }))).toBe(true)
  })

  it('budget: requires non-empty string', () => {
    const validate = STEPS[7]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ monthly_budget_range: 'under_10k' }))).toBe(
      true,
    )
  })

  it('timing: requires non-empty string', () => {
    const validate = STEPS[8]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ timing: 'launch_now' }))).toBe(true)
  })

  it('attribution: requires object with source', () => {
    const validate = STEPS[9]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ attribution: { source: 'instagram' } }))).toBe(
      true,
    )
    expect(
      validate(
        makeState({
          attribution: { source: 'referral', referral_text: 'friend' },
        }),
      ),
    ).toBe(true)
  })

  it('contact-name: requires non-empty trimmed string', () => {
    const validate = STEPS[10]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ contact_name: '  ' }))).toBe(false)
    expect(validate(makeState({ contact_name: 'John' }))).toBe(true)
  })

  it('contact-title: requires non-empty trimmed string', () => {
    const validate = STEPS[11]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ contact_title: 'CEO' }))).toBe(true)
  })

  it('contact-whatsapp: requires E.164 format', () => {
    const validate = STEPS[12]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ contact_whatsapp_e164: '12345' }))).toBe(false)
    expect(
      validate(makeState({ contact_whatsapp_e164: '+5491155550000' })),
    ).toBe(true)
  })

  it('review: no validation', () => {
    expect(STEPS[13]!.validate).toBeUndefined()
  })
})
