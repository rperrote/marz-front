import { t } from '@lingui/core/macro'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const NICHE_OPTIONS: { value: string; label: () => string }[] = [
  { value: 'fintech', label: () => t`Fintech` },
  { value: 'tech', label: () => t`Tech` },
  { value: 'gaming', label: () => t`Gaming` },
  { value: 'comedy', label: () => t`Comedy` },
  { value: 'lifestyle', label: () => t`Lifestyle` },
  { value: 'business', label: () => t`Business` },
  { value: 'productivity', label: () => t`Productividad` },
  { value: 'fitness', label: () => t`Fitness` },
  { value: 'personal_finance', label: () => t`Finanzas personales` },
  { value: 'crypto', label: () => t`Crypto` },
  { value: 'food', label: () => t`Food` },
  { value: 'travel', label: () => t`Travel` },
  { value: 'beauty', label: () => t`Beauty` },
  { value: 'fashion', label: () => t`Moda` },
  { value: 'parenting', label: () => t`Parenting` },
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
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿En qué te especializás?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Hasta 5 nichos. Matching va a ser más preciso.`}
        </p>
      </div>
      <div className="flex max-w-[720px] flex-wrap justify-center gap-2">
        {NICHE_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t`${selected.length} de 5 seleccionados`}
      </p>
    </div>
  )
}
