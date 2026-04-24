import { createFileRoute, redirect } from '@tanstack/react-router'
import { getStepId } from '#/features/identity/onboarding/brand/steps'

export const Route = createFileRoute('/onboarding/brand/')({
  beforeLoad: () => {
    throw redirect({
      to: '/onboarding/brand/$step',
      params: { step: getStepId(0) },
    })
  },
})
