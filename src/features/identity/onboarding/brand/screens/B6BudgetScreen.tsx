import { useMemo } from 'react'
import { t } from '@lingui/core/macro'
import { Slider } from '#/components/ui/slider'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'

const BUDGET_SNAPS = [
  MonthlyBudgetRange.zero,
  MonthlyBudgetRange.under_10k,
  MonthlyBudgetRange['10k_to_25k'],
  MonthlyBudgetRange['25k_to_50k'],
  MonthlyBudgetRange['50k_plus'],
] as const

const BUDGET_LABELS: Record<MonthlyBudgetRange, () => string> = {
  [MonthlyBudgetRange.zero]: () => t`$0 — Sin presupuesto definido`,
  [MonthlyBudgetRange.under_10k]: () => t`Menos de $10k`,
  [MonthlyBudgetRange['10k_to_25k']]: () => t`$10k – $25k`,
  [MonthlyBudgetRange['25k_to_50k']]: () => t`$25k – $50k`,
  [MonthlyBudgetRange['50k_plus']]: () => t`Más de $50k`,
}

function budgetToIndex(budget: MonthlyBudgetRange | undefined): number {
  if (!budget) return 0
  const idx = BUDGET_SNAPS.indexOf(budget)
  return idx === -1 ? 0 : idx
}

export function B6BudgetScreen() {
  const store = useBrandOnboardingStore()
  const currentIndex = budgetToIndex(store.monthly_budget_range)

  const label = useMemo(() => {
    const budget = BUDGET_SNAPS[currentIndex]
    return budget ? BUDGET_LABELS[budget]() : ''
  }, [currentIndex])

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuál es tu presupuesto mensual?`}
        subtitle={t`Estimación del presupuesto para campañas con creators.`}
      />
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6">
        <p
          className="text-[length:var(--font-size-lg)] font-semibold text-foreground"
          aria-live="polite"
        >
          {label}
        </p>
        <Slider
          min={0}
          max={BUDGET_SNAPS.length - 1}
          step={1}
          value={[currentIndex]}
          onValueChange={([val]) => {
            if (val != null) {
              const budget = BUDGET_SNAPS[val]
              if (budget) {
                store.setField('monthly_budget_range', budget)
              }
            }
          }}
          aria-label={t`Presupuesto mensual`}
        />
        <div className="flex w-full justify-between text-[length:var(--font-size-xs)] text-muted-foreground">
          <span>{t`$0`}</span>
          <span>{t`$50k+`}</span>
        </div>
      </div>
    </div>
  )
}
