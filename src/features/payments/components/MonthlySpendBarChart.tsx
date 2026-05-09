import { t } from '@lingui/core/macro'

import type { BrandPaymentsMonthlySpend } from '../api/brandPaymentsSchemas'
import {
  formatCompactUsd,
  formatMonthLabel,
  formatUsd,
  parsePaymentAmount,
} from './paymentFormatting'

interface MonthlySpendBarChartProps {
  data: BrandPaymentsMonthlySpend[]
}

export function MonthlySpendBarChart({ data }: MonthlySpendBarChartProps) {
  const values = data.map((item) => parsePaymentAmount(item.amount))
  const maxValue = Math.max(...values, 0)
  const hasData = maxValue > 0

  return (
    <section
      aria-label={t`Gasto mensual en USD`}
      className="flex h-[300px] min-w-0 flex-1 flex-col rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t`Gasto por mes`}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t`Montos mensuales en USD`}
          </p>
        </div>
        {hasData ? (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {formatCompactUsd(maxValue)} max
          </span>
        ) : null}
      </div>

      <p className="sr-only">
        {data
          .map(
            (item) =>
              `${formatMonthLabel(item.month)} ${formatUsd(item.amount)}`,
          )
          .join(', ')}
      </p>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t`Sin gasto mensual para mostrar.`}
        </div>
      ) : (
        <div className="mt-4 grid min-h-0 flex-1 grid-cols-[repeat(var(--bar-count),minmax(0,1fr))] items-end gap-3 [--bar-count:12]">
          {data.map((item) => {
            const amount = parsePaymentAmount(item.amount)
            const height = hasData ? Math.max((amount / maxValue) * 100, 3) : 3
            const active = amount > 0 && height >= 60

            return (
              <div key={item.month} className="flex h-full min-w-0 flex-col">
                <div className="flex min-h-0 flex-1 items-end px-1">
                  <div
                    className={
                      active
                        ? 'w-full rounded-sm bg-primary'
                        : 'w-full rounded-sm bg-muted'
                    }
                    style={{ height: `${height}%` }}
                    title={`${formatMonthLabel(item.month)} ${formatUsd(item.amount)}`}
                  />
                </div>
                <span
                  className={
                    active
                      ? 'mt-2 truncate text-center text-xs font-semibold text-foreground'
                      : 'mt-2 truncate text-center text-xs text-muted-foreground'
                  }
                >
                  {formatMonthLabel(item.month)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
