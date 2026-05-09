import { t } from '@lingui/core/macro'
import { DollarSign, RadioTower, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { CampaignOverviewResponse } from '#/shared/api/generated/model'

interface StatsBlockProps {
  overview: CampaignOverviewResponse
}

interface StatCardProps {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'neutral'
}

export function StatsBlock({ overview }: StatsBlockProps) {
  return (
    <section aria-label={t`Estadísticas de campaña`}>
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={t`Applications`}
          value={formatCompactNumber(overview.applications_count)}
          helper={t`Postulaciones recibidas`}
          icon={UsersRound}
        />
        <ReachStat overview={overview} />
        <StatCard
          label={t`Budget`}
          value={formatUsd(overview.budget_total_usd)}
          helper={t`${formatUsd(overview.budget_spent_usd)} usados`}
          icon={DollarSign}
          tone="success"
        />
      </div>
    </section>
  )
}

function ReachStat({ overview }: StatsBlockProps) {
  if (!overview.reach_available || overview.reach === null) {
    return (
      <StatCard
        label={t`Reach`}
        value={t`No disponible`}
        helper={t`Todavía no hay datos suficientes para estimar el reach.`}
        icon={RadioTower}
        tone="neutral"
      />
    )
  }

  return (
    <StatCard
      label={t`Reach`}
      value={formatCompactNumber(overview.reach)}
      helper={t`Estimado entre participantes`}
      icon={RadioTower}
    />
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'default',
}: StatCardProps) {
  const helperClassName =
    tone === 'success'
      ? 'text-success'
      : tone === 'neutral'
        ? 'text-muted-foreground'
        : 'text-muted-foreground'

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 truncate text-[28px] leading-tight font-semibold text-foreground">
            {value}
          </p>
          <p className={`mt-2 text-xs ${helperClassName}`}>{helper}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatUsd(amount: string) {
  const number = Number.parseFloat(amount)
  if (Number.isNaN(number)) return `USD ${amount}`

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number)
}

export const campaignOverviewFormatters = {
  formatCompactNumber,
  formatUsd,
}
