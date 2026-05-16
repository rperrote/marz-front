import { t } from '@lingui/core/macro'
import { Plus, Trash2, Zap } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

import type {
  OfferBonusTermsFormValues,
  OfferBonusWindowFormValues,
} from '../schemas/createOffer'

let nextWindowId = 0
function generateWindowId() {
  nextWindowId += 1
  return `bonus-window-${nextWindowId}`
}

const defaultBonusWindow: OfferBonusWindowFormValues = {
  _key: generateWindowId(),
  window_hours: 24,
  bonus_amount: { type: 'percentage', value: 10 },
}

interface OfferBonusEditorProps {
  value: OfferBonusTermsFormValues
  error?: string
  onChange: (value: OfferBonusTermsFormValues) => void
}

export function OfferBonusEditor({
  value,
  error,
  onChange,
}: OfferBonusEditorProps) {
  const windows = value.speed_bonus_windows

  function updateWindow(
    index: number,
    patch: Partial<OfferBonusWindowFormValues>,
  ) {
    onChange({
      ...value,
      speed_bonus_windows: windows.map((window, currentIndex) =>
        currentIndex === index ? { ...window, ...patch } : window,
      ),
    })
  }

  function removeWindow(index: number) {
    onChange({
      ...value,
      speed_bonus_windows: windows.filter(
        (_window, currentIndex) => currentIndex !== index,
      ),
    })
  }

  function addWindow() {
    onChange({
      ...value,
      speed_bonus_windows: [
        ...windows,
        { ...defaultBonusWindow, _key: generateWindowId() },
      ],
    })
  }

  return (
    <div className="space-y-2">
      {windows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-[length:var(--font-size-xs)] text-muted-foreground">
          {t`Todavía no agregaste ventanas de bono.`}
        </div>
      ) : null}

      {windows.map((window, index) => {
        const windowNumber = index + 1
        const isFixed = window.bonus_amount.type === 'fixed'
        const numericValue =
          window.bonus_amount.type === 'fixed'
            ? window.bonus_amount.amount_usd
            : window.bonus_amount.value

        return (
          <fieldset
            key={window._key}
            className="rounded-xl border border-border bg-card p-3"
          >
            <legend className="sr-only">
              {t`Ventana de bono ${windowNumber}`}
            </legend>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"
              >
                <Zap className="size-4 text-[color:var(--color-warning,var(--primary))]" />
              </span>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[length:var(--font-size-sm)] font-medium text-card-foreground">
                  {t`Bono por velocidad`}
                </p>
                <p className="truncate text-[length:var(--font-size-xs)] text-muted-foreground">
                  {(() => {
                    const hours = window.window_hours
                    return t`Publica en menos de ${hours} h`
                  })()}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t`Eliminar bono`}
                onClick={() => removeWindow(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
              <label className="flex items-center gap-2 rounded-lg bg-input/40 px-2 py-1">
                <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
                  {t`En`}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label={t`Horas de la ventana ${windowNumber}`}
                  min={1}
                  max={720}
                  value={window.window_hours}
                  onChange={(event) =>
                    updateWindow(index, {
                      window_hours: Number(event.target.value),
                    })
                  }
                  className="h-7 border-0 bg-transparent p-0 font-mono text-[length:var(--font-size-sm)] shadow-none focus-visible:ring-0"
                />
                <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
                  {t`h`}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={window.bonus_amount.type}
                  aria-label={t`Tipo de bono ${windowNumber}`}
                  onValueChange={(nextType) => {
                    if (!nextType) return
                    if (nextType === 'percentage') {
                      updateWindow(index, {
                        bonus_amount: { type: 'percentage', value: 10 },
                      })
                    }
                    if (nextType === 'fixed') {
                      updateWindow(index, {
                        bonus_amount: { type: 'fixed', amount_usd: 100 },
                      })
                    }
                  }}
                  className="inline-flex shrink-0 rounded-lg bg-muted p-0.5"
                >
                  <ToggleGroupItem
                    value="percentage"
                    aria-label={t`Porcentaje`}
                    className="h-7 rounded-md px-2 text-[length:var(--font-size-xs)] data-[state=on]:bg-background"
                  >
                    %
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="fixed"
                    aria-label={t`Monto fijo`}
                    className="h-7 rounded-md px-2 text-[length:var(--font-size-xs)] data-[state=on]:bg-background"
                  >
                    USD
                  </ToggleGroupItem>
                </ToggleGroup>

                <Input
                  type="number"
                  inputMode="decimal"
                  aria-label={t`Valor del bono ${windowNumber}`}
                  min={1}
                  value={numericValue}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value)
                    updateWindow(index, {
                      bonus_amount: isFixed
                        ? { type: 'fixed', amount_usd: nextValue }
                        : { type: 'percentage', value: nextValue },
                    })
                  }}
                  className="h-9 rounded-lg bg-input/40 font-mono"
                />
              </div>
            </div>
          </fieldset>
        )
      })}

      {error ? (
        <p
          role="status"
          aria-live="polite"
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addWindow}
        className="w-full rounded-xl"
      >
        <Plus className="size-4" />
        {t`Agregar bono`}
      </Button>
    </div>
  )
}
