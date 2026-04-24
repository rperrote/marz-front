import { t } from '@lingui/core/macro'
import { TrendingUp } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { Vertical } from '#/shared/api/generated/model/vertical'
import { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'
import { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'

const BUDGET_USD: Record<MonthlyBudgetRange, number> = {
  zero: 0,
  under_10k: 10_000,
  '10k_to_25k': 25_000,
  '25k_to_50k': 50_000,
  '50k_plus': 100_000,
}

const BUDGET_LABEL: Record<MonthlyBudgetRange, string> = {
  zero: '$0',
  under_10k: '$10K',
  '10k_to_25k': '$25K',
  '25k_to_50k': '$50K',
  '50k_plus': '$100K+',
}

const OBJECTIVE_LABEL: Record<MarketingObjective, () => string> = {
  awareness: () => t`awareness`,
  performance: () => t`performance`,
  launch: () => t`lanzamiento`,
  community: () => t`comunidad`,
}

const VERTICAL_LABEL: Record<Vertical, () => string> = {
  fintech: () => t`fintech`,
  tech: () => t`tech`,
  ecommerce: () => t`e-commerce`,
  education: () => t`educación`,
  food: () => t`comida`,
  fitness: () => t`fitness`,
  health: () => t`salud`,
  entertainment: () => t`entretenimiento`,
  beauty: () => t`belleza`,
  gaming: () => t`gaming`,
  travel: () => t`viajes`,
  fashion: () => t`moda`,
  mobile_apps: () => t`apps móviles`,
  crypto: () => t`crypto`,
  ai_tech: () => t`AI / tech`,
  other: () => t`tu vertical`,
}

function formatViews(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m.toFixed(1).replace('.0', '')}M`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

function formatClicks(n: number): string {
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

export function B10PrimingProjection() {
  const store = useBrandOnboardingStore()
  const budget = store.monthly_budget_range ?? MonthlyBudgetRange.under_10k
  const budgetUsd = BUDGET_USD[budget] || 10_000
  const objective = store.marketing_objective ?? MarketingObjective.performance
  const vertical = store.vertical ?? Vertical.other

  const views = budgetUsd * 240
  const clicks = budgetUsd * 1.8
  const cpc = clicks > 0 ? budgetUsd / clicks : 0

  const highlight: 'views' | 'clicks' =
    objective === 'performance' ? 'clicks' : 'views'

  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[500px] w-[680px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <TrendingUp className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Proyección con tu budget y objetivo`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Así se ve lo que podés alcanzar.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Con ${BUDGET_LABEL[budget]}/mes y foco en ${OBJECTIVE_LABEL[objective]()}, tu primer mes promedio en ${VERTICAL_LABEL[vertical]()} LatAm.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-6">
        <StatCard
          value={`~${formatViews(views)}`}
          label={t`views proyectados / mes`}
          highlighted={highlight === 'views'}
        />
        <StatCard
          value={`~${formatClicks(clicks)}`}
          label={t`clicks al sitio / mes`}
          highlighted={highlight === 'clicks'}
        />
        <StatCard
          value={`~$${cpc.toFixed(2)}`}
          label={t`CPC estimado`}
          highlighted={false}
        />
      </div>

      <p className="relative max-w-[720px] text-center text-[11px] leading-[1.5] text-muted-foreground">
        {t`Los números son referencias históricas en ${VERTICAL_LABEL[vertical]()} LatAm. Variables como creador, formato y hook mueven fuerte.`}
      </p>
    </div>
  )
}

function StatCard({
  value,
  label,
  highlighted,
}: {
  value: string
  label: string
  highlighted: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-[160px] w-[280px] flex-col items-center justify-center gap-2 rounded-3xl bg-card p-7',
        highlighted ? 'border border-primary' : 'border border-border',
      )}
    >
      <span
        className={cn(
          'text-[56px] font-bold leading-[1.2] tracking-[-0.02em]',
          highlighted ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
