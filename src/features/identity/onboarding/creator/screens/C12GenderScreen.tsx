import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { track } from '#/shared/analytics/track'
import type { CreatorOnboardingPayloadGender as Gender } from '#/shared/api/generated/model/creatorOnboardingPayloadGender'
import { CreatorOnboardingPayloadGender } from '#/shared/api/generated/model/creatorOnboardingPayloadGender'
import { useCreatorOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

type NonNullGender = Exclude<Gender, null>

const GENDER_OPTIONS: { value: NonNullGender; label: () => string }[] = [
  { value: CreatorOnboardingPayloadGender.male, label: () => t`Masculino` },
  { value: CreatorOnboardingPayloadGender.female, label: () => t`Femenino` },
  {
    value: CreatorOnboardingPayloadGender.non_binary,
    label: () => t`No binario`,
  },
  {
    value: CreatorOnboardingPayloadGender.prefer_not_say,
    label: () => t`Prefiero no decir`,
  },
]

export function C12GenderScreen() {
  const store = useCreatorOnboardingStore()
  const navigate = useNavigate()

  const skip = () => {
    store.setField('gender', null)
    const currentIndex = STEPS.findIndex((s) => s.id === 'gender')
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1
      track('onboarding_step_skipped', { step: 'gender', index: currentIndex })
      store.goTo(nextIndex)
      void navigate({
        to: '/onboarding/creator/$step',
        params: { step: getStepId(nextIndex) },
      })
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cuál es tu género?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Algunas campañas filtran por género de creador. Opcional.`}
        </p>
      </div>
      <div
        className="flex flex-wrap justify-center gap-2.5"
        role="radiogroup"
        aria-label={t`Género`}
      >
        {GENDER_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            role="radio"
            selected={store.gender === o.value}
            onToggle={() => store.setField('gender', o.value)}
          />
        ))}
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
