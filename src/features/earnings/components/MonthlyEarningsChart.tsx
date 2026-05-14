import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { cn } from '#/lib/utils'
import type { MonthlyEarningsBucket } from '#/shared/api/generated/model'

interface MonthlyEarningsChartProps {
  buckets: MonthlyEarningsBucket[]
}

interface ChartBucket {
  month: string
  label: string
  amount: number
  formattedAmount: string
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactMoneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
})

export function MonthlyEarningsChart({ buckets }: MonthlyEarningsChartProps) {
  const chartBuckets = buckets.map(toChartBucket)
  const totalAmount = chartBuckets.reduce(
    (total, bucket) => total + bucket.amount,
    0,
  )
  const maxAmount = Math.max(...chartBuckets.map((bucket) => bucket.amount), 0)
  const hasChartData = chartBuckets.length > 0 && maxAmount > 0

  return (
    <section
      aria-labelledby="monthly-earnings-chart-title"
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="monthly-earnings-chart-title"
            className="text-sm font-semibold text-foreground"
          >
            <Trans>Earnings by month</Trans>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <Trans>Monthly paid earnings</Trans>
          </p>
        </div>
        <p className="w-fit rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {compactMoneyFormatter.format(totalAmount)} <Trans>total</Trans>
        </p>
      </div>

      {hasChartData ? (
        <div
          role="img"
          aria-labelledby="monthly-earnings-chart-title"
          aria-describedby="monthly-earnings-chart-summary"
          className="mt-5"
        >
          <p id="monthly-earnings-chart-summary" className="sr-only">
            {buildChartSummary(chartBuckets, totalAmount)}
          </p>
          <div className="flex h-60 gap-3">
            <div
              aria-hidden="true"
              className="flex w-9 flex-col justify-between pb-6 text-right font-mono text-[11px] text-muted-foreground"
            >
              {buildYAxisTicks(maxAmount).map((tick) => (
                <span key={tick}>{compactMoneyFormatter.format(tick)}</span>
              ))}
            </div>
            <div
              className="grid min-w-0 flex-1 items-end gap-2"
              style={{
                gridTemplateColumns: `repeat(${chartBuckets.length}, minmax(0, 1fr))`,
              }}
            >
              {chartBuckets.map((bucket, index) => (
                <div
                  key={bucket.month}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <div className="flex h-48 w-full items-end">
                    <div
                      title={`${bucket.label}: ${bucket.formattedAmount}`}
                      className={cn(
                        'min-h-2 w-full rounded-t-lg transition-colors',
                        index >= chartBuckets.length - 3
                          ? 'bg-primary'
                          : 'bg-muted',
                      )}
                      style={{
                        height: `${Math.max((bucket.amount / maxAmount) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className="w-full truncate text-center font-mono text-[11px] text-muted-foreground">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <dl className="sr-only">
            {chartBuckets.map((bucket) => (
              <div key={bucket.month}>
                <dt>{bucket.label}</dt>
                <dd>{bucket.formattedAmount}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="mt-5 flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            <Trans>
              No earnings yet for this period. When payments are marked as paid,
              they will appear here.
            </Trans>
          </p>
        </div>
      )}
    </section>
  )
}

function toChartBucket(bucket: MonthlyEarningsBucket): ChartBucket {
  const [year, month] = bucket.month.split('-')
  const date =
    year && month ? new Date(Number(year), Number(month) - 1, 1) : new Date()

  return {
    month: bucket.month,
    label: monthFormatter.format(date),
    amount: Number(bucket.amount),
    formattedAmount: moneyFormatter.format(Number(bucket.amount)),
  }
}

function buildYAxisTicks(maxAmount: number) {
  const tickSize = Math.max(Math.ceil(maxAmount / 4 / 1000) * 1000, 1000)
  const topTick = tickSize * 4

  return [topTick, tickSize * 3, tickSize * 2, tickSize, 0]
}

function buildChartSummary(buckets: ChartBucket[], totalAmount: number) {
  const highestBucket = buckets.reduce((highest, bucket) =>
    bucket.amount > highest.amount ? bucket : highest,
  )
  const total = moneyFormatter.format(totalAmount)
  const highestMonth = highestBucket.label
  const highestAmount = highestBucket.formattedAmount

  return t`Monthly earnings total ${total}. Highest month ${highestMonth} with ${highestAmount}.`
}
