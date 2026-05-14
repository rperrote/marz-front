import { t } from '@lingui/core/macro'

import type { BrandPaymentsSearch } from '../api/brandPaymentsSchemas'
import { cn } from '#/lib/utils'

export type PaymentsPeriod = BrandPaymentsSearch['period']

interface PaymentsPeriodSegmentedControlProps {
  value: PaymentsPeriod
  onChange: (value: PaymentsPeriod) => void
}

function getPeriodOptions(): Array<{ value: PaymentsPeriod; label: string }> {
  return [
    /* eslint-disable lingui/no-unlocalized-strings -- Search parameter enum values are not translatable UI copy. */
    { value: '30d', label: t`30d` },
    { value: '90d', label: t`90d` },
    { value: '12m', label: t`12m` },
    { value: 'all', label: t`All` },
    /* eslint-enable lingui/no-unlocalized-strings */
  ]
}

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
      {getPeriodOptions().map((option) => {
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
