import { useEffect } from 'react'
import {
  Outlet,
  createFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router'

import { useMe } from '#/shared/api/generated/accounts/accounts'
import { WizardShell } from '#/shared/ui/wizard'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import {
  STEPS,
  getStepIndex,
  getStepId,
} from '#/features/identity/onboarding/brand/steps'
import { track } from '#/shared/analytics/track'
import { enforceOnboardingRoute } from './-onboardingGuard'

export const Route = createFileRoute('/onboarding/brand')({
  beforeLoad: async ({ context }) => {
    await enforceOnboardingRoute({
      queryClient: context.queryClient,
      kind: 'brand',
      routePath: '/onboarding/brand',
      fallbackPath: '/campaigns',
    })
  },
  component: BrandOnboardingLayout,
})

function BrandOnboardingLayout() {
  const router = useRouter()
  const meQuery = useMe()

  const me = meQuery.data
  const onboardingStatus =
    me?.status === 200 ? me.data.onboarding_status : undefined
  const kind = me?.status === 200 ? me.data.kind : undefined

  useEffect(() => {
    useBrandOnboardingStore.persist.rehydrate()
  }, [])

  const params = useParams({ strict: false })
  const stepId = (params as Record<string, string | undefined>).step
  const currentIndex = stepId ? getStepIndex(stepId) : -1
  const store = useBrandOnboardingStore()

  if (currentIndex === -1) return null

  const currentStep = STEPS[currentIndex]!
  const percent = ((currentIndex + 1) / STEPS.length) * 100
  const stepLabel = `Paso ${currentIndex + 1} de ${STEPS.length}`

  const validate = currentStep.validate
  const hideFooter =
    currentStep.id === 'loading' ||
    currentStep.id === 'paywall' ||
    currentStep.id === 'confirmation'

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1
      const nextId = getStepId(nextIndex)
      store.goTo(nextIndex)
      track('onboarding_step_completed', {
        step: currentStep.id,
        index: currentIndex,
      })
      void router.navigate({
        to: '/onboarding/brand/$step',
        params: { step: nextId },
      })
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevId = getStepId(prevIndex)
      store.goTo(prevIndex)
      void router.navigate({
        to: '/onboarding/brand/$step',
        params: { step: prevId },
      })
    }
  }

  const handleExit = () => {
    track('onboarding_abandoned', {
      step: currentStep.id,
      index: currentIndex,
    })
    void router.navigate({ to: '/' })
  }

  if (meQuery.isLoading) return null
  if (!me || me.status !== 200) return null
  if (kind !== 'brand' || onboardingStatus !== 'onboarding_pending') return null

  return (
    <WizardShell
      stepLabel={stepLabel}
      percent={percent}
      onBack={currentIndex > 0 ? handleBack : undefined}
      onNext={handleNext}
      nextDisabled={validate ? !validate(store) : false}
      hideFooter={hideFooter}
      onExit={handleExit}
    >
      <Outlet />
    </WizardShell>
  )
}
