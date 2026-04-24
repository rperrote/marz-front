import { t } from '@lingui/core/macro'
import { TrendingUp } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Slider } from '#/components/ui/slider'
import { useBrandOnboardingStore } from '../store'
import { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'
import type { Vertical } from '#/shared/api/generated/model/vertical'

const BUDGET_SNAPS = [
  MonthlyBudgetRange.under_10k,
  MonthlyBudgetRange['10k_to_25k'],
  MonthlyBudgetRange['25k_to_50k'],
  MonthlyBudgetRange['50k_plus'],
] as const

const BIG_NUMBERS: Record<(typeof BUDGET_SNAPS)[number], string> = {
  under_10k: '10.000',
  '10k_to_25k': '25.000',
  '25k_to_50k': '50.000',
  '50k_plus': '100.000+',
}

const TICKS: { value: (typeof BUDGET_SNAPS)[number]; label: string }[] = [
  { value: MonthlyBudgetRange.under_10k, label: '$10K' },
  { value: MonthlyBudgetRange['10k_to_25k'], label: '$25K' },
  { value: MonthlyBudgetRange['25k_to_50k'], label: '$50K' },
  { value: MonthlyBudgetRange['50k_plus'], label: '$100K+' },
]

const VERTICAL_HINTS: Partial<Record<Vertical, () => string>> = {
  fintech: () => t`Marcas de fintech invierten entre $8K y $15K/mes`,
}

function getIndex(budget: MonthlyBudgetRange | undefined): number {
  if (!budget || budget === MonthlyBudgetRange.zero) return 0
  const idx = BUDGET_SNAPS.indexOf(budget)
  return idx === -1 ? 0 : idx
}

export function B6BudgetScreen() {
  const store = useBrandOnboardingStore()
  const currentIndex = getIndex(store.monthly_budget_range)
  const currentSnap = BUDGET_SNAPS[currentIndex]!
  const bigNumber = BIG_NUMBERS[currentSnap]

  const hint =
    (store.vertical && VERTICAL_HINTS[store.vertical]?.()) ??
    t`Marcas similares invierten entre $8K y $15K/mes`

  return (
    <div className="flex w-full flex-col items-center gap-12">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cuánto pensás invertir por mes?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Usamos tu respuesta para recomendarte el mejor plan.`}
        </p>
      </div>

      <div className="flex items-end" aria-live="polite">
        <span className="text-[36px] font-semibold tracking-[-0.02em] text-muted-foreground">
          $
        </span>
        <span className="text-[80px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {bigNumber}
        </span>
        <span className="pb-3 pl-1 text-lg font-medium text-muted-foreground">
          {t`/mes`}
        </span>
      </div>

      <div className="flex w-full max-w-[640px] flex-col gap-3">
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
        <div className="flex w-full justify-between">
          {TICKS.map((tick, i) => (
            <span
              key={tick.value}
              className={cn(
                'text-[11px]',
                i === currentIndex
                  ? 'font-semibold text-foreground'
                  : 'font-normal text-muted-foreground',
              )}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-[18px] py-3">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
          <TrendingUp className="size-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  )
}
