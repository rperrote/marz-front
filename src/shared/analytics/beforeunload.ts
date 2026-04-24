import { track } from '#/shared/analytics/track'

type OnboardingCheck = () => boolean

const checks: Set<OnboardingCheck> = new Set()

export function registerOnboardingCheck(check: OnboardingCheck): () => void {
  checks.add(check)
  return () => {
    checks.delete(check)
  }
}

function handleBeforeUnload(): void {
  for (const check of checks) {
    if (check()) {
      track('onboarding_abandoned')
      return
    }
  }
}

let installed = false

export function installBeforeUnloadListener(): void {
  if (installed) return
  installed = true
  window.addEventListener('beforeunload', handleBeforeUnload)
}

export function uninstallBeforeUnloadListener(): void {
  if (!installed) return
  installed = false
  window.removeEventListener('beforeunload', handleBeforeUnload)
}

export function resetOnboardingChecks(): void {
  checks.clear()
}
