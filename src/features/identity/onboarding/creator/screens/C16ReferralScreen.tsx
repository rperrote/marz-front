import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { OnboardingField } from '#/features/identity/onboarding/shared/components'
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
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Quién te invitó?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Si alguien te pasó el link, dejalo. Los bonificamos.`}
        </p>
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-5">
        <OnboardingField
          label={t`Handle o nombre (opcional)`}
          className="max-w-none"
        >
          <Input
            value={store.referral_text ?? ''}
            onChange={handleChange}
            placeholder="@valenzavacs"
            maxLength={2000}
          />
        </OnboardingField>
      </div>
      <Button
        variant="ghost"
        onClick={skip}
        className="text-xs text-muted-foreground"
      >
        {t`Omitir`}
      </Button>
    </div>
  )
}
