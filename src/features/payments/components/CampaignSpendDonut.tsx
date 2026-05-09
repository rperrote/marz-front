import { t } from '@lingui/core/macro'

import type { BrandPaymentsCampaignBreakdown } from '../api/brandPaymentsSchemas'
import {
  formatCompactUsd,
  formatUsd,
  parsePaymentAmount,
} from './paymentFormatting'

interface CampaignSpendDonutProps {
  data: BrandPaymentsCampaignBreakdown[]
  totalAmount: string
}

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted)',
]

const radius = 54
const circumference = 2 * Math.PI * radius

export function CampaignSpendDonut({
  data,
  totalAmount,
}: CampaignSpendDonutProps) {
  const total = parsePaymentAmount(totalAmount)
  const visibleData =
    data.length > 0
      ? data
      : [
          {
            campaign_id: null,
            campaign_name: t`Otros`,
            amount: '0',
            percentage: '100',
            bucket: 'others' as const,
          },
        ]

  let offset = 0

  return (
    <section
      aria-label={t`Distribución de gasto por campaña en USD`}
      className="flex h-[300px] w-[480px] shrink-0 flex-col rounded-lg border border-border bg-card p-5"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {t`Gasto por campaña`}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t`Bucket Otros calculado por backend`}
        </p>
      </div>

      <p className="sr-only">
        {visibleData
          .map(
            (item) =>
              `${getCampaignLabel(item)} ${formatUsd(item.amount)} ${item.percentage}%`,
          )
          .join(', ')}
      </p>

      <div className="mt-4 flex min-h-0 flex-1 items-center gap-5">
        <div className="relative flex size-40 shrink-0 items-center justify-center">
          <svg aria-hidden viewBox="0 0 140 140" className="size-40 -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="20"
            />
            {visibleData.map((item, index) => {
              const percentage = parsePaymentAmount(item.percentage)
              const segmentLength = (percentage / 100) * circumference
              const dashOffset = offset
              offset += segmentLength

              return (
                <circle
                  key={`${item.campaign_id ?? 'others'}-${item.campaign_name}`}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={chartColors[index] ?? 'var(--muted)'}
                  strokeWidth="20"
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={-dashOffset}
                  strokeLinecap="butt"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {formatCompactUsd(total)}
            </span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {visibleData.map((item, index) => {
            const isOthers = item.bucket === 'others'
            return (
              <li
                key={`${item.campaign_id ?? 'others'}-${item.campaign_name}`}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: chartColors[index] ?? 'var(--muted)',
                  }}
                />
                <span
                  className={
                    isOthers
                      ? 'min-w-0 flex-1 truncate text-muted-foreground'
                      : 'min-w-0 flex-1 truncate text-foreground'
                  }
                >
                  {getCampaignLabel(item)}
                </span>
                <span
                  className={
                    isOthers
                      ? 'font-mono font-semibold text-muted-foreground'
                      : 'font-mono font-semibold text-foreground'
                  }
                >
                  {formatCompactUsd(item.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function getCampaignLabel(item: BrandPaymentsCampaignBreakdown): string {
  if (item.bucket === 'others') return t`Otros`
  return item.campaign_name
}
