import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import {
  registerOnboardingCheck,
  installBeforeUnloadListener,
  uninstallBeforeUnloadListener,
  resetOnboardingChecks,
} from '#/shared/analytics/beforeunload'

describe('beforeunload listener', () => {
  beforeEach(() => {
    resetTrackedEvents()
    resetOnboardingChecks()
    installBeforeUnloadListener()
  })

  afterEach(() => {
    uninstallBeforeUnloadListener()
  })

  it('tracks onboarding_abandoned when a check returns true', () => {
    const unregister = registerOnboardingCheck(() => true)

    window.dispatchEvent(new Event('beforeunload'))

    const events = getTrackedEvents()
    expect(events).toHaveLength(1)
    expect(events[0]!.event).toBe('onboarding_abandoned')

    unregister()
  })

  it('does not track when all checks return false', () => {
    const unregister = registerOnboardingCheck(() => false)

    window.dispatchEvent(new Event('beforeunload'))

    expect(getTrackedEvents()).toHaveLength(0)

    unregister()
  })

  it('does not track when no checks are registered', () => {
    window.dispatchEvent(new Event('beforeunload'))

    expect(getTrackedEvents()).toHaveLength(0)
  })

  it('unregisters a check via returned cleanup', () => {
    const unregister = registerOnboardingCheck(() => true)
    unregister()

    window.dispatchEvent(new Event('beforeunload'))

    expect(getTrackedEvents()).toHaveLength(0)
  })
})
