import { t } from '@lingui/core/macro'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { FieldRow } from '#/shared/ui/form'

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

  return (
    <div className="space-y-3">
      {windows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
          {t`Todavía no agregaste ventanas de bono.`}
        </div>
      ) : null}

      {windows.map((window, index) => {
        const windowNumber = index + 1

        return (
          <fieldset
            key={window._key}
            className="space-y-3 rounded-xl border border-border bg-background p-3"
          >
            <legend className="sr-only">
              {t`Ventana de bono ${windowNumber}`}
            </legend>
            <div className="flex items-start gap-3">
              <FieldRow label={t`Horas`} className="flex-1">
                {(aria) => (
                  <Input
                    {...aria}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={720}
                    value={window.window_hours}
                    onChange={(event) =>
                      updateWindow(index, {
                        window_hours: Number(event.target.value),
                      })
                    }
                    className="rounded-xl bg-input/50"
                  />
                )}
              </FieldRow>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t`Eliminar ventana de bono`}
                onClick={() =>
                  onChange({
                    ...value,
                    speed_bonus_windows: windows.filter(
                      (_window, currentIndex) => currentIndex !== index,
                    ),
                  })
                }
                className="mt-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
              <FieldRow label={t`Tipo de bono`}>
                {(aria) => (
                  <ToggleGroup
                    id={aria.id}
                    type="single"
                    value={window.bonus_amount.type}
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
                    className="grid w-full grid-cols-2 rounded-xl bg-muted p-1"
                  >
                    <ToggleGroupItem
                      value="percentage"
                      aria-label={t`Porcentaje`}
                      className="rounded-lg data-[state=on]:bg-background"
                    >
                      %
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="fixed"
                      aria-label={t`Monto fijo`}
                      className="rounded-lg data-[state=on]:bg-background"
                    >
                      USD
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </FieldRow>

              <FieldRow label={t`Valor`}>
                {(aria) => (
                  <Input
                    {...aria}
                    type="number"
                    inputMode="decimal"
                    min={1}
                    value={
                      window.bonus_amount.type === 'fixed'
                        ? window.bonus_amount.amount_usd
                        : window.bonus_amount.value
                    }
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      updateWindow(index, {
                        bonus_amount:
                          window.bonus_amount.type === 'fixed'
                            ? { type: 'fixed', amount_usd: nextValue }
                            : { type: 'percentage', value: nextValue },
                      })
                    }}
                    className="rounded-xl bg-input/50"
                  />
                )}
              </FieldRow>
            </div>
          </fieldset>
        )
      })}

      {error ? (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...value,
            speed_bonus_windows: [
              ...windows,
              { ...defaultBonusWindow, _key: generateWindowId() },
            ],
          })
        }
        className="w-full rounded-xl"
      >
        <Plus className="size-4" />
        {t`Agregar ventana`}
      </Button>
    </div>
  )
}
