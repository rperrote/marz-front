import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'
import { useCreatorEarningsQuery } from '../hooks/useCreatorEarnings'
import { EarningsKpiGrid } from './EarningsKpiGrid'
import { EarningsPeriodControl } from './EarningsPeriodControl'
import { MonthlyEarningsChart } from './MonthlyEarningsChart'
import { EarningsPaymentsTable } from './EarningsPaymentsTable'
import { PendingBonusPanel } from './PendingBonusPanel'

interface EarningsPageProps {
  period: CreatorEarningsPeriod
  q?: string
  cursor?: string
  onPeriodChange: (period: CreatorEarningsPeriod) => void
}

export function EarningsPage({
  period,
  q,
  cursor,
  onPeriodChange,
}: EarningsPageProps) {
  const earningsQuery = useCreatorEarningsQuery({
    period,
    q,
    cursor,
    limit: 25,
  })

  if (earningsQuery.isLoading) {
    return <EarningsPageShell period={period} onPeriodChange={onPeriodChange} />
  }

  if (earningsQuery.isError || !earningsQuery.data) {
    return (
      <EarningsPageShell period={period} onPeriodChange={onPeriodChange}>
        <div
          role="alert"
          className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          <Trans>
            We could not load earnings right now. Try refreshing the page.
          </Trans>
        </div>
      </EarningsPageShell>
    )
  }

  return (
    <EarningsPageShell period={period} onPeriodChange={onPeriodChange}>
      <EarningsKpiGrid kpis={earningsQuery.data.kpis} />
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <MonthlyEarningsChart buckets={earningsQuery.data.monthly_earnings} />
        </div>
        <PendingBonusPanel
          period={period}
          pendingBonuses={earningsQuery.data.pending_bonuses}
        />
      </div>
      <EarningsPaymentsTable
        period={period}
        q={q}
        payments={earningsQuery.data.payments}
      />
    </EarningsPageShell>
  )
}

interface EarningsPageShellProps {
  period: CreatorEarningsPeriod
  onPeriodChange: (period: CreatorEarningsPeriod) => void
  children?: ReactNode
}

function EarningsPageShell({
  period,
  onPeriodChange,
  children,
}: EarningsPageShellProps) {
  return (
    <div className="min-h-full bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[28px] leading-tight font-bold tracking-normal">
              <Trans>Earnings</Trans>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans>Track your payments and pending bonuses</Trans>
            </p>
          </div>
          <EarningsPeriodControl value={period} onChange={onPeriodChange} />
        </header>

        {children ?? <EarningsSkeleton />}
      </div>
    </div>
  )
}

function EarningsSkeleton() {
  return (
    <>
      <section
        aria-label={t`Loading earnings KPIs`}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[118px] animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </section>
      <div className="h-[354px] animate-pulse rounded-2xl border border-border bg-card" />
    </>
  )
}
