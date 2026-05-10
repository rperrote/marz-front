import { Trash2, Zap } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import type { BonusAmountValues } from '../schemas'
import { BonusAmountField } from './BonusAmountField'
import { parseNumberInput } from './parseNumberInput'

interface SpeedBonusRowProps {
  index: number
  windowHours: number
  bonus: BonusAmountValues
  windowHoursError?: string
  bonusError?: string
  onWindowHoursChange: (value: number) => void
  onBonusChange: (value: BonusAmountValues) => void
  onWindowHoursBlur: () => void
  onBonusBlur: () => void
  onRemove: () => void
}

export function SpeedBonusRow({
  index,
  windowHours,
  bonus,
  windowHoursError,
  bonusError,
  onWindowHoursChange,
  onBonusChange,
  onWindowHoursBlur,
  onBonusBlur,
  onRemove,
}: SpeedBonusRowProps) {
  const hasError = Boolean(windowHoursError ?? bonusError)
  const rowLabel = t`Speed ${String(index + 1)}`

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-start',
        hasError && 'border-destructive/50',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-amber-600 dark:text-amber-400">
          <Zap className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t`Ventana de Speed Bonus`}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t`Bonus aplicado si el creator publica antes del límite.`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:w-[360px]">
        <label className="flex flex-col gap-1">
          <span className="sr-only">{t`Horas ventana ${String(index + 1)}`}</span>
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
              aria-label={t`Horas ventana ${String(index + 1)}`}
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
          aria-label={t`Eliminar ventana ${String(index + 1)}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
