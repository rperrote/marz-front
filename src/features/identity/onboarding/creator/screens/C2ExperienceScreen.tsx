import { t } from '@lingui/core/macro'
import {
  OnboardingSectionTitle,
  OnboardingOptionChip,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'
import type { CreatorOnboardingPayloadExperienceLevel as ExperienceLevel } from '#/shared/api/generated/model/creatorOnboardingPayloadExperienceLevel'
import { CreatorOnboardingPayloadExperienceLevel } from '#/shared/api/generated/model/creatorOnboardingPayloadExperienceLevel'

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: () => string }[] = [
  {
    value: CreatorOnboardingPayloadExperienceLevel.none,
    label: () => t`Ninguna`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['1_to_5'],
    label: () => t`1 a 5 collabs`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['6_to_20'],
    label: () => t`6 a 20 collabs`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['20_plus_primary'],
    label: () => t`+20 collabs (es mi actividad principal)`,
  },
]

export function C2ExperienceScreen() {
  const store = useCreatorOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuánta experiencia tenés con marcas?`}
        subtitle={t`Elegí la opción que mejor te represente.`}
      />
      <div
        className="flex flex-wrap justify-center gap-3"
        role="radiogroup"
        aria-label={t`Nivel de experiencia`}
      >
        {EXPERIENCE_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            role="radio"
            selected={store.experience_level === o.value}
            onToggle={() => store.setField('experience_level', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
