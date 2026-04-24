import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  STEPS,
  getStepIndex,
  getStepId,
} from '#/features/identity/onboarding/brand/steps'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { track } from '#/shared/analytics/track'

export const Route = createFileRoute('/onboarding/brand/$step')({
  component: BrandOnboardingStep,
})

function BrandOnboardingStep() {
  const { step } = Route.useParams()
  const navigate = useNavigate()
  const stepIndex = getStepIndex(step)
  const isInvalid = stepIndex === -1

  useEffect(() => {
    if (isInvalid) {
      void navigate({
        to: '/onboarding/brand/$step',
        params: { step: getStepId(0) },
        replace: true,
      })
      return
    }

    useBrandOnboardingStore.setState({ currentStepIndex: stepIndex })
    track('onboarding_step_entered', {
      step: STEPS[stepIndex]!.id,
      index: stepIndex,
    })
  }, [step, stepIndex, isInvalid, navigate])

  if (isInvalid) return null

  const currentStep = STEPS[stepIndex]!
  const StepComponent = currentStep.component

  return <StepComponent />
}
