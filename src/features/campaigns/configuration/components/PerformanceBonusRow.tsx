import { Trash2, TrendingUp } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import type { BonusAmountValues } from '../schemas'
import { BonusAmountField } from './BonusAmountField'
import { parseNumberInput } from './parseNumberInput'

interface PerformanceBonusRowProps {
  index: number
  views: number
  windowHours: number
  bonus: BonusAmountValues
  viewsError?: string
  windowHoursError?: string
  bonusError?: string
  onViewsChange: (value: number) => void
  onWindowHoursChange: (value: number) => void
  onBonusChange: (value: BonusAmountValues) => void
  onViewsBlur: () => void
  onWindowHoursBlur: () => void
  onBonusBlur: () => void
  onRemove: () => void
}

export function PerformanceBonusRow({
  index,
  views,
  windowHours,
  bonus,
  viewsError,
  windowHoursError,
  bonusError,
  onViewsChange,
  onWindowHoursChange,
  onBonusChange,
  onViewsBlur,
  onWindowHoursBlur,
  onBonusBlur,
  onRemove,
}: PerformanceBonusRowProps) {
  const hasError = Boolean(viewsError ?? windowHoursError ?? bonusError)
  const rowLabel = t`Milestone ${String(index + 1)}`

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-start',
        hasError && 'border-destructive/50',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-blue-600 dark:text-blue-400">
          <TrendingUp className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t`Milestone de Performance`}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t`Bonus pagado si el video alcanza el target dentro de la ventana.`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:w-[520px]">
        <label className="flex flex-col gap-1">
          <span className="sr-only">{t`Views milestone ${String(index + 1)}`}</span>
          <div className="flex items-center rounded-xl border border-input bg-muted/60 px-2">
            <Input
              value={views === 0 ? '' : views}
              onChange={(event) =>
                onViewsChange(parseNumberInput(event.target.value))
              }
              onBlur={onViewsBlur}
              type="number"
              inputMode="numeric"
              min={1}
              aria-invalid={viewsError ? true : undefined}
              aria-label={t`Views milestone ${String(index + 1)}`}
              className="h-9 border-0 bg-transparent px-1 font-mono shadow-none focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">{t`views`}</span>
          </div>
          {viewsError ? (
            <span role="alert" className="text-xs text-destructive">
              {viewsError}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="sr-only">
            {t`Horas milestone ${String(index + 1)}`}
          </span>
          <div className="flex items-center rounded-xl border border-input bg-muted/60 px-2">
            <Input
              value={windowHours === 0 ? '' : windowHours}
              onChange={(event) =>
                onWindowHoursChange(parseNumberInput(event.target.value))
              }
              onBlur={onWindowHoursBlur}
              type="number"
              inputMode="numeric"
              min={1}
              max={720}
              aria-invalid={windowHoursError ? true : undefined}
              aria-label={t`Horas milestone ${String(index + 1)}`}
              className="h-9 border-0 bg-transparent px-1 font-mono shadow-none focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">{t`hs`}</span>
          </div>
          {windowHoursError ? (
            <span role="alert" className="text-xs text-destructive">
              {windowHoursError}
            </span>
          ) : null}
        </label>

        <BonusAmountField
          label={rowLabel}
          bonus={bonus}
          error={bonusError}
          onChange={onBonusChange}
          onBlur={onBonusBlur}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="self-start text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={t`Eliminar milestone ${String(index + 1)}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
