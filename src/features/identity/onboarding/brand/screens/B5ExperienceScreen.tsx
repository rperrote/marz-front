import { t } from '@lingui/core/macro'
import {
  OnboardingSectionTitle,
  OnboardingOptionChip,
} from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { CreatorExperience } from '#/shared/api/generated/model/creatorExperience'
import { CreatorSourcingHistory } from '#/shared/api/generated/model/creatorSourcingHistory'

const EXPERIENCE_OPTIONS: { value: CreatorExperience; label: () => string }[] =
  [
    {
      value: CreatorExperience.never,
      label: () => t`Nunca trabajé con creators`,
    },
    {
      value: CreatorExperience.tried_without_results,
      label: () => t`Probé sin resultados`,
    },
    { value: CreatorExperience.scaling, label: () => t`Ya estoy escalando` },
  ]

const SOURCING_OPTIONS: {
  value: CreatorSourcingHistory
  label: () => string
}[] = [
  { value: CreatorSourcingHistory.none, label: () => t`Sin experiencia` },
  {
    value: CreatorSourcingHistory.small_scale,
    label: () => t`Algunos creators`,
  },
  { value: CreatorSourcingHistory.large_scale, label: () => t`A gran escala` },
  { value: CreatorSourcingHistory.agency, label: () => t`A través de agencia` },
]

export function B5ExperienceScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuál es tu experiencia con creators?`}
        subtitle={t`Nos ayuda a personalizar las recomendaciones.`}
      />
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground">
            {t`Experiencia con creators`}
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((o) => (
              <OnboardingOptionChip
                key={o.value}
                label={o.label()}
                role="radio"
                selected={store.creator_experience === o.value}
                onToggle={() => store.setField('creator_experience', o.value)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground">
            {t`¿Cómo buscaste creators antes?`}
          </p>
          <div className="flex flex-wrap gap-2">
            {SOURCING_OPTIONS.map((o) => (
              <OnboardingOptionChip
                key={o.value}
                label={o.label()}
                role="radio"
                selected={store.creator_sourcing_history === o.value}
                onToggle={() =>
                  store.setField('creator_sourcing_history', o.value)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
