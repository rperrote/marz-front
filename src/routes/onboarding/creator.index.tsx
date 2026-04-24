import { createFileRoute, redirect } from '@tanstack/react-router'
import { getStepId } from '#/features/identity/onboarding/creator/steps'

export const Route = createFileRoute('/onboarding/creator/')({
  beforeLoad: () => {
    throw redirect({
      to: '/onboarding/creator/$step',
      params: { step: getStepId(0) },
    })
  },
})
