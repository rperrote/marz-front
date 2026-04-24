import { describe, it, expect, beforeEach } from 'vitest'
import { useCreatorOnboardingStore } from './store'
import { STEPS } from './steps'

beforeEach(() => {
  useCreatorOnboardingStore.setState({
    currentStepIndex: 0,
    display_name: undefined,
    handle: undefined,
  })
  sessionStorage.clear()
})

describe('useCreatorOnboardingStore', () => {
  it('starts at index 0', () => {
    expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
  })

  describe('setField', () => {
    it('sets a field value', () => {
      useCreatorOnboardingStore.getState().setField('display_name', 'Ana')
      expect(useCreatorOnboardingStore.getState().display_name).toBe('Ana')
    })

    it('overwrites existing field', () => {
      const { setField } = useCreatorOnboardingStore.getState()
      setField('handle', 'ana_1')
      setField('handle', 'ana_2')
      expect(useCreatorOnboardingStore.getState().handle).toBe('ana_2')
    })

    it('clears field error on setField', () => {
      useCreatorOnboardingStore
        .getState()
        .setFieldErrors({ handle: 'required' })
      useCreatorOnboardingStore.getState().setField('handle', 'test')
      expect(useCreatorOnboardingStore.getState().fieldErrors.handle).toBe(
        undefined,
      )
    })
  })

  describe('goTo', () => {
    it('navigates to a specific index', () => {
      useCreatorOnboardingStore.getState().goTo(5)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(5)
    })

    it('clamps to 0 for negative indices', () => {
      useCreatorOnboardingStore.getState().goTo(-3)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
    })

    it('clamps to last step for out-of-range indices', () => {
      useCreatorOnboardingStore.getState().goTo(100)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(
        STEPS.length - 1,
      )
    })
  })

  describe('reset', () => {
    it('resets currentStepIndex to 0', () => {
      useCreatorOnboardingStore.getState().goTo(7)
      useCreatorOnboardingStore.getState().reset()
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
    })

    it('clears all payload fields', () => {
      useCreatorOnboardingStore.getState().setField('handle', 'test')
      useCreatorOnboardingStore.getState().setField('display_name', 'Test')
      useCreatorOnboardingStore.getState().reset()
      expect(useCreatorOnboardingStore.getState().handle).toBeUndefined()
      expect(useCreatorOnboardingStore.getState().display_name).toBeUndefined()
    })
  })

  describe('persist to sessionStorage', () => {
    it('persists state after rehydrate', () => {
      useCreatorOnboardingStore.getState().setField('display_name', 'TestUser')
      useCreatorOnboardingStore.getState().goTo(3)

      const stored = sessionStorage.getItem('marz-creator-onboarding')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!) as { state: Record<string, unknown> }
      expect(parsed.state.display_name).toBe('TestUser')
      expect(parsed.state.currentStepIndex).toBe(3)
    })

    it('rehydrates from sessionStorage', () => {
      sessionStorage.setItem(
        'marz-creator-onboarding',
        JSON.stringify({
          state: { currentStepIndex: 5, handle: 'persisted' },
          version: 0,
        }),
      )

      useCreatorOnboardingStore.persist.rehydrate()

      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(5)
      expect(useCreatorOnboardingStore.getState().handle).toBe('persisted')
    })
  })
})
