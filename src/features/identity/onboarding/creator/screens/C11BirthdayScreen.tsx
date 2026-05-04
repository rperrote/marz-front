import { useCallback, useMemo, useState } from 'react'
import { t } from '@lingui/core/macro'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { FieldRow } from '#/shared/ui/form'
import { useCreatorOnboardingStore } from '../store'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function parseBirthday(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return { year: '', month: '', day: '' }
  return {
    year: match[1],
    month: String(Number(match[2])),
    day: String(Number(match[3])),
  }
}

export function C11BirthdayScreen() {
  const store = useCreatorOnboardingStore()

  const [{ year, month, day }, setParts] = useState(() =>
    parseBirthday(store.birthday),
  )

  const update = useCallback(
    (patch: { y?: string; m?: string; d?: string }) => {
      setParts((prev) => {
        const next = {
          year: patch.y ?? prev.year,
          month: patch.m ?? prev.month,
          day: patch.d ?? prev.day,
        }
        if (next.year && next.month && next.day) {
          store.setField(
            'birthday',
            `${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}`,
          )
        } else {
          store.setField('birthday', '')
        }
        return next
      })
    },
    [store],
  )

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 80 }, (_, i) => `${current - 13 - i}`)
  }, [])

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cuándo es tu cumpleaños?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas filtran por rango de edad. Nunca publicamos la fecha exacta.`}
        </p>
      </div>

      <div className="flex w-full max-w-[520px] gap-3">
        <FieldRow label={t`Día`} className="flex-1">
          {(aria) => (
            <Select value={day} onValueChange={(v) => update({ d: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => `${i + 1}`).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
        <FieldRow label={t`Mes`} className="flex-[1.4]">
          {(aria) => (
            <Select value={month} onValueChange={(v) => update({ m: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={name} value={`${i + 1}`}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
        <FieldRow label={t`Año`} className="flex-1">
          {(aria) => (
            <Select value={year} onValueChange={(v) => update({ y: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
      </div>
      {store.fieldErrors.birthday && (
        <p className="text-xs text-destructive" role="alert">
          {store.fieldErrors.birthday}
        </p>
      )}
    </div>
  )
}
