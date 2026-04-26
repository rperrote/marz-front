import { t } from '@lingui/core/macro'
import { cn } from '#/lib/utils'

interface WeightSumIndicatorProps {
  sum: number
}

export function WeightSumIndicator({ sum }: WeightSumIndicatorProps) {
  const isValid = sum === 100

  return (
    <div
      aria-live="polite"
      className={cn(
        'sticky top-4 z-10 flex items-center justify-center rounded-lg border px-4 py-2 text-[length:var(--font-size-sm)] font-semibold transition-colors',
        isValid
          ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {t`Total ${String(sum)} / 100`}
    </div>
  )
}
