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
import { useCreatorOnboardingStore } from '#/features/identity/onboarding/creator/store'
import {
  STEPS,
  getStepIndex,
  getStepId,
} from '#/features/identity/onboarding/creator/steps'
import { track } from '#/shared/analytics/track'

export const Route = createFileRoute('/onboarding/creator')({
  component: CreatorOnboardingLayout,
})

function CreatorOnboardingLayout() {
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
    useCreatorOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      void navigate({ to: '/auth' })
      return
    }
    if (!me || me.status !== 200) return

    if (kind !== 'creator') {
      void navigate({ to: '/' })
      return
    }
    if (onboardingStatus !== 'onboarding_pending') {
      const destination =
        redirectTo && redirectTo !== '/onboarding/creator'
          ? redirectTo
          : '/offers'
      track('onboarding_redirect_enforced', {
        from: '/onboarding/creator',
        to: destination,
      })
      void navigate({ to: destination })
    }
  }, [isLoaded, isSignedIn, me, onboardingStatus, redirectTo, kind, navigate])

  const params = useParams({ strict: false })
  const stepId = (params as Record<string, string | undefined>).step
  const currentIndex = stepId ? getStepIndex(stepId) : -1

  if (currentIndex === -1) return null

  const currentStep = STEPS[currentIndex]!
  const percent = ((currentIndex + 1) / STEPS.length) * 100
  const stepLabel = `Paso ${currentIndex + 1} de ${STEPS.length}`

  const store = useCreatorOnboardingStore()
  const validate = currentStep.validate
  const hideFooter = currentStep.id === 'confirmation'

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
        to: '/onboarding/creator/$step',
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
        to: '/onboarding/creator/$step',
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
  if (kind !== 'creator' || onboardingStatus !== 'onboarding_pending')
    return null

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
