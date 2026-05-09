import { t } from '@lingui/core/macro'

import type { BrandPaymentsSearch } from '../api/brandPaymentsSchemas'
import { cn } from '#/lib/utils'

export type PaymentsPeriod = BrandPaymentsSearch['period']

interface PaymentsPeriodSegmentedControlProps {
  value: PaymentsPeriod
  onChange: (value: PaymentsPeriod) => void
}

const periodOptions: Array<{ value: PaymentsPeriod; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: '12m' },
  { value: 'all', label: 'All' },
]

export function PaymentsPeriodSegmentedControl({
  value,
  onChange,
}: PaymentsPeriodSegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={t`Periodo de gastos`}
      className="flex items-center gap-1 rounded-full bg-muted p-1"
    >
      {periodOptions.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              selected && 'bg-card font-semibold text-foreground shadow-sm',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
