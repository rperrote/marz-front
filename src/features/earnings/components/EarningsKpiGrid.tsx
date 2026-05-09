import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { CalendarDays, Hourglass, TrendingUp, Wallet } from 'lucide-react'

import type { CreatorEarningsKPI } from '#/shared/api/generated/model'

interface EarningsKpiGridProps {
  kpis: CreatorEarningsKPI
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

export function EarningsKpiGrid({ kpis }: EarningsKpiGridProps) {
  const nextPayoutSupportingText = formatNextPayoutSupportingText(kpis)

  return (
    <section
      aria-label={t`Earnings KPIs`}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <KpiCard
        icon={<Wallet className="size-3.5" aria-hidden="true" />}
        label={t`Total earned`}
        value={formatMoney(kpis.total_earned.amount)}
        supportingText={t`All time`}
      />
      <KpiCard
        icon={<TrendingUp className="size-3.5" aria-hidden="true" />}
        label={t`Earned in period`}
        value={formatMoney(kpis.earned_in_period.amount)}
        supportingText={t`Current period`}
      />
      <KpiCard
        icon={
          <Hourglass className="size-3.5 text-warning" aria-hidden="true" />
        }
        label={t`Pending payout`}
        value={formatMoney(kpis.pending_payout.amount)}
        supportingText={t`Awaiting payout`}
      />
      <KpiCard
        highlighted
        icon={
          <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
        }
        label={t`Next payout`}
        value={formatMoney(kpis.next_payout.amount)}
        supportingText={nextPayoutSupportingText}
      />
    </section>
  )
}

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string
  supportingText: string
  highlighted?: boolean
}

function KpiCard({
  icon,
  label,
  value,
  supportingText,
  highlighted = false,
}: KpiCardProps) {
  return (
    <article
      className={[
        'rounded-2xl border bg-card p-5 text-card-foreground',
        highlighted ? 'border-primary' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-[28px] leading-tight font-bold tracking-normal text-foreground">
        {value}
      </p>
      <p
        className={
          highlighted
            ? 'mt-1 text-xs font-medium text-primary'
            : 'mt-1 text-xs text-muted-foreground'
        }
      >
        {supportingText}
      </p>
    </article>
  )
}

function formatMoney(amount: string) {
  return moneyFormatter.format(Number(amount))
}

function formatNextPayoutSupportingText(kpis: CreatorEarningsKPI) {
  if (!kpis.next_payout.date_available || !kpis.next_payout.estimated_date) {
    return t`Date unavailable`
  }

  return dateFormatter.format(new Date(kpis.next_payout.estimated_date))
}
