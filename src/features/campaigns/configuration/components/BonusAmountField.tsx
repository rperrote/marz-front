import { t } from '@lingui/core/macro'

import { Input } from '#/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { BONUS_CURRENCY } from '../schemas'
import type { BonusAmountValues } from '../schemas'
import { parseNumberInput } from './parseNumberInput'

interface BonusAmountFieldProps {
  label: string
  bonus: BonusAmountValues
  error?: string
  onChange: (next: BonusAmountValues) => void
  onBlur: () => void
}

export function BonusAmountField({
  label,
  bonus,
  error,
  onChange,
  onBlur,
}: BonusAmountFieldProps) {
  function handleModeChange(value: string) {
    if (value === '' || value === bonus.type) return
    if (value === 'percentage') {
      onChange({ type: 'percentage', percentage: 10 })
    } else {
      onChange({ type: 'fixed', amount: '', currency: BONUS_CURRENCY })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="sr-only">{label}</span>
      <ToggleGroup
        type="single"
        value={bonus.type}
        onValueChange={handleModeChange}
        variant="outline"
        size="sm"
        aria-label={t`Tipo de bonus para ${label}`}
      >
        <ToggleGroupItem value="percentage" aria-label={t`Porcentaje`}>
          %
        </ToggleGroupItem>
        <ToggleGroupItem value="fixed" aria-label={t`Monto fijo en USD`}>
          USD
        </ToggleGroupItem>
      </ToggleGroup>

      {bonus.type === 'percentage' ? (
        <label className="flex flex-col gap-1">
          <div className="flex items-center rounded-xl border border-input bg-muted/60 px-2">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +
            </span>
            <Input
              value={bonus.percentage === 0 ? '' : bonus.percentage}
              onChange={(event) =>
                onChange({
                  type: 'percentage',
                  percentage: parseNumberInput(event.target.value),
                })
              }
              onBlur={onBlur}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              aria-invalid={error ? true : undefined}
              aria-label={t`Porcentaje de ${label}`}
              className="h-9 border-0 bg-transparent px-1 font-mono shadow-none focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          {error ? (
            <span role="alert" className="text-xs text-destructive">
              {error}
            </span>
          ) : null}
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <div className="flex items-center rounded-xl border border-input bg-muted/60 px-2">
            <span className="text-sm font-semibold text-muted-foreground">
              $
            </span>
            <Input
              value={bonus.amount}
              onChange={(event) =>
                onChange({
                  type: 'fixed',
                  amount: event.target.value,
                  currency: BONUS_CURRENCY,
                })
              }
              onBlur={onBlur}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={error ? true : undefined}
              aria-label={t`Monto de ${label} en USD`}
              className="h-9 border-0 bg-transparent px-1 font-mono shadow-none focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">USD</span>
          </div>
          {error ? (
            <span role="alert" className="text-xs text-destructive">
              {error}
            </span>
          ) : null}
        </label>
      )}
    </div>
  )
}
