import { useEffect } from 'react'
import { t } from '@lingui/core/macro'
import { Loader2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

export function B12LoadingScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentIndex = STEPS.findIndex((s) => s.id === 'loading')
      if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
        const nextIndex = currentIndex + 1
        store.goTo(nextIndex)
        void navigate({
          to: '/onboarding/brand/$step',
          params: { step: getStepId(nextIndex) },
        })
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [navigate, store])

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Loader2 className="size-12 animate-spin text-primary" />
      <OnboardingSectionTitle
        title={t`Preparando todo para vos...`}
        subtitle={t`Estamos configurando tu workspace y buscando los mejores matches.`}
      />
    </div>
  )
}
