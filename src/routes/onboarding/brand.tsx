import { useEffect } from 'react'
import {
  Outlet,
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { useAuth } from '@clerk/tanstack-react-start'

import { useMe } from '#/shared/api/generated/accounts/accounts'
import { OnboardingShell } from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import {
  STEPS,
  getStepIndex,
  getStepId,
} from '#/features/identity/onboarding/brand/steps'
import { track } from '#/shared/analytics/track'

export const Route = createFileRoute('/onboarding/brand')({
  component: BrandOnboardingLayout,
})

function BrandOnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const meQuery = useMe({
    query: { enabled: isLoaded && !!isSignedIn },
  })

  const me = meQuery.data
  const onboardingStatus =
    me?.status === 200 ? me.data.onboarding_status : undefined
  const redirectTo = me?.status === 200 ? me.data.redirect_to : undefined
  const kind = me?.status === 200 ? me.data.kind : undefined

  useEffect(() => {
    useBrandOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      void navigate({ to: '/auth' })
      return
    }
    if (!me || me.status !== 200) return

    if (kind !== 'brand') {
      void navigate({ to: '/' })
      return
    }
    if (onboardingStatus !== 'onboarding_pending') {
      const destination =
        redirectTo && redirectTo !== '/onboarding/brand'
          ? redirectTo
          : '/campaigns'
      track('onboarding_redirect_enforced', {
        from: '/onboarding/brand',
        to: destination,
      })
      void navigate({ to: destination })
    }
  }, [isLoaded, isSignedIn, me, onboardingStatus, redirectTo, kind, navigate])

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
      void navigate({
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
      void navigate({
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
    void navigate({ to: '/' })
  }

  if (!isLoaded || !isSignedIn || meQuery.isLoading) return null
  if (!me || me.status !== 200) return null
  if (kind !== 'brand' || onboardingStatus !== 'onboarding_pending') return null

  return (
    <OnboardingShell
      stepLabel={stepLabel}
      percent={percent}
      onBack={currentIndex > 0 ? handleBack : undefined}
      onNext={handleNext}
      nextDisabled={validate ? !validate(store) : false}
      hideFooter={hideFooter}
      onExit={handleExit}
    >
      <Outlet />
    </OnboardingShell>
  )
}
