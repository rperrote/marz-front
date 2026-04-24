import { describe, it, expect, beforeEach } from 'vitest'
import { useBrandOnboardingStore } from './store'
import { STEPS } from './steps'

beforeEach(() => {
  useBrandOnboardingStore.setState({
    currentStepIndex: 0,
    name: undefined,
    vertical: undefined,
  })
  sessionStorage.clear()
})

describe('useBrandOnboardingStore', () => {
  it('starts at index 0', () => {
    expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(0)
  })

  describe('setField', () => {
    it('sets a field value', () => {
      useBrandOnboardingStore.getState().setField('name', 'Acme')
      expect(useBrandOnboardingStore.getState().name).toBe('Acme')
    })

    it('overwrites existing field', () => {
      const { setField } = useBrandOnboardingStore.getState()
      setField('name', 'Acme')
      setField('name', 'Globex')
      expect(useBrandOnboardingStore.getState().name).toBe('Globex')
    })
  })

  describe('goTo', () => {
    it('navigates to a specific index', () => {
      useBrandOnboardingStore.getState().goTo(5)
      expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(5)
    })

    it('clamps to 0 for negative indices', () => {
      useBrandOnboardingStore.getState().goTo(-3)
      expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(0)
    })

    it('clamps to last step for out-of-range indices', () => {
      useBrandOnboardingStore.getState().goTo(100)
      expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(
        STEPS.length - 1,
      )
    })
  })

  describe('reset', () => {
    it('resets currentStepIndex to 0', () => {
      useBrandOnboardingStore.getState().goTo(7)
      useBrandOnboardingStore.getState().reset()
      expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(0)
    })
  })

  describe('persist to sessionStorage', () => {
    it('persists state after rehydrate', () => {
      useBrandOnboardingStore.getState().setField('name', 'TestBrand')
      useBrandOnboardingStore.getState().goTo(3)

      const stored = sessionStorage.getItem('marz-brand-onboarding')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!) as { state: Record<string, unknown> }
      expect(parsed.state.name).toBe('TestBrand')
      expect(parsed.state.currentStepIndex).toBe(3)
    })

    it('rehydrates from sessionStorage', () => {
      sessionStorage.setItem(
        'marz-brand-onboarding',
        JSON.stringify({
          state: { currentStepIndex: 5, name: 'Persisted' },
          version: 0,
        }),
      )

      useBrandOnboardingStore.persist.rehydrate()

      expect(useBrandOnboardingStore.getState().currentStepIndex).toBe(5)
      expect(useBrandOnboardingStore.getState().name).toBe('Persisted')
    })
  })
})
