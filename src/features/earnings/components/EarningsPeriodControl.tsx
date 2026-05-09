import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'

const periodOptions = [
  { value: '30d', label: () => t`30d` },
  { value: '90d', label: () => t`90d` },
  { value: '12m', label: () => t`12m` },
  { value: 'all', label: () => t`All time` },
] as const satisfies ReadonlyArray<{
  value: CreatorEarningsPeriod
  label: () => string
}>

interface EarningsPeriodControlProps {
  value: CreatorEarningsPeriod
  onChange: (period: CreatorEarningsPeriod) => void
}

export function EarningsPeriodControl({
  value,
  onChange,
}: EarningsPeriodControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={t`Earnings period`}
      className="flex h-9 w-fit items-center gap-1 rounded-full bg-muted p-1"
    >
      {periodOptions.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 rounded-full px-3.5 text-xs font-medium text-muted-foreground transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              isActive &&
                'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
              !isActive && 'hover:bg-surface-hover hover:text-foreground',
            )}
          >
            {option.label()}
          </button>
        )
      })}
    </div>
  )
}
