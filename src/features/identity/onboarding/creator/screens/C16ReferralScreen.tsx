import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
import { track } from '#/shared/analytics/track'
import { useCreatorOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

export function C16ReferralScreen() {
  const store = useCreatorOnboardingStore()
  const navigate = useNavigate()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('referral_text', e.target.value || null)
    },
    [store],
  )

  const skip = () => {
    store.setField('referral_text', null)
    const currentIndex = STEPS.findIndex((s) => s.id === 'referral')
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1
      track('onboarding_step_skipped', {
        step: 'referral',
        index: currentIndex,
      })
      store.goTo(nextIndex)
      void navigate({
        to: '/onboarding/creator/$step',
        params: { step: getStepId(nextIndex) },
      })
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cómo nos conociste?`}
        subtitle={t`Opcional — nos ayuda a mejorar.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField label={t`Referido o fuente`}>
          <Input
            value={store.referral_text ?? ''}
            onChange={handleChange}
            placeholder={t`Un amigo, Instagram, Google...`}
            maxLength={2000}
          />
        </OnboardingField>
      </div>
      <Button variant="ghost" onClick={skip} className="text-muted-foreground">
        {t`Omitir`}
      </Button>
    </div>
  )
}
