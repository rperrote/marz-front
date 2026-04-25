import { useState } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Slider as SliderPrimitive } from 'radix-ui'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '#/components/ui/card'
import type { ScoringDimension } from '../store'

interface ScoringDimensionCardProps {
  index: number
  dimension: ScoringDimension
  onChange: (updated: ScoringDimension) => void
  onRemove: () => void
}

function SignalList({
  label,
  signals,
  onChange,
  addLabel,
}: {
  label: string
  signals: string[]
  onChange: (signals: string[]) => void
  addLabel: string
}) {
  const [draft, setDraft] = useState('')

  const addSignal = () => {
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    onChange([...signals, trimmed])
    setDraft('')
  }

  const removeSignal = (idx: number) => {
    onChange(signals.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground">
        {label}
      </span>
      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {signals.map((signal, idx) => (
            <span
              key={signal}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[length:var(--font-size-xs)] text-foreground"
            >
              {signal}
              <button
                type="button"
                onClick={() => removeSignal(idx)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t`Eliminar señal ${signal}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSignal()
            }
          }}
          placeholder={t`Agregar señal…`}
          className="h-8 text-[length:var(--font-size-xs)]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSignal}
          disabled={draft.trim().length === 0}
          aria-label={addLabel}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function ScoringDimensionCard({
  index,
  dimension,
  onChange,
  onRemove,
}: ScoringDimensionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[length:var(--font-size-sm)]">
          {t`Dimensión ${String(index + 1)}`}
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={t`Eliminar dimensión ${String(index + 1)}`}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`dim-${String(index)}-name`}
            className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground"
          >
            {t`Nombre`}
          </label>
          <Input
            id={`dim-${String(index)}-name`}
            value={dimension.name}
            onChange={(e) => onChange({ ...dimension, name: e.target.value })}
            placeholder={t`Ej: Engagement rate`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`dim-${String(index)}-desc`}
            className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground"
          >
            {t`Descripción`}
          </label>
          <Textarea
            id={`dim-${String(index)}-desc`}
            value={dimension.description}
            onChange={(e) =>
              onChange({ ...dimension, description: e.target.value })
            }
            placeholder={t`Qué evalúa esta dimensión`}
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`dim-${String(index)}-weight`}
              className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground"
            >
              {t`Peso`}
            </label>
            <span className="text-[length:var(--font-size-sm)] font-semibold tabular-nums text-foreground">
              {String(dimension.weight_pct)}%
            </span>
          </div>
          <SliderPrimitive.Root
            value={[dimension.weight_pct]}
            onValueChange={([val]) => {
              if (val !== undefined) {
                onChange({ ...dimension, weight_pct: val })
              }
            }}
            min={1}
            max={100}
            step={1}
            className="relative flex w-full touch-none items-center select-none"
          >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              aria-label={t`Peso dimensión ${String(index + 1)}`}
              className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden"
            />
          </SliderPrimitive.Root>
        </div>
        <SignalList
          label={t`Señales positivas`}
          addLabel={t`Agregar señal positiva`}
          signals={dimension.positive_signals}
          onChange={(signals) =>
            onChange({ ...dimension, positive_signals: signals })
          }
        />
        <SignalList
          label={t`Señales negativas`}
          addLabel={t`Agregar señal negativa`}
          signals={dimension.negative_signals}
          onChange={(signals) =>
            onChange({ ...dimension, negative_signals: signals })
          }
        />
      </CardContent>
    </Card>
  )
}
