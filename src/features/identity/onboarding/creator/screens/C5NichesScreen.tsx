import { t } from '@lingui/core/macro'
import {
  OnboardingSectionTitle,
  OnboardingOptionChip,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const NICHE_OPTIONS: { value: string; label: () => string }[] = [
  { value: 'fashion', label: () => t`Moda` },
  { value: 'beauty', label: () => t`Belleza` },
  { value: 'fitness', label: () => t`Fitness` },
  { value: 'food', label: () => t`Comida` },
  { value: 'travel', label: () => t`Viajes` },
  { value: 'tech', label: () => t`Tecnología` },
  { value: 'gaming', label: () => t`Gaming` },
  { value: 'music', label: () => t`Música` },
  { value: 'comedy', label: () => t`Comedia` },
  { value: 'education', label: () => t`Educación` },
  { value: 'lifestyle', label: () => t`Lifestyle` },
  { value: 'sports', label: () => t`Deportes` },
  { value: 'parenting', label: () => t`Maternidad / Paternidad` },
  { value: 'pets', label: () => t`Mascotas` },
  { value: 'finance', label: () => t`Finanzas` },
]

export function C5NichesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.niches ?? []

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      store.setField(
        'niches',
        selected.filter((v) => v !== value),
      )
    } else if (selected.length < 5) {
      store.setField('niches', [...selected, value])
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuáles son tus nichos?`}
        subtitle={t`Elegí entre 1 y 5 nichos que representen tu contenido.`}
      />
      <p
        className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground"
        aria-live="polite"
      >
        {t`${selected.length} de 5 seleccionados`}
      </p>
      <div className="flex max-w-[560px] flex-wrap justify-center gap-3">
        {NICHE_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
    </div>
  )
}
