import { useCallback, useMemo } from 'react'
import { t } from '@lingui/core/macro'
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

export function C11BirthdayScreen() {
  const store = useCreatorOnboardingStore()

  const { year, month, day } = useMemo(() => {
    const b = store.birthday ?? ''
    const [y, m, d] = b.split('-')
    return { year: y ?? '', month: m ?? '', day: d ?? '' }
  }, [store.birthday])

  const update = useCallback(
    (patch: { y?: string; m?: string; d?: string }) => {
      const y = patch.y ?? year
      const m = patch.m ?? month
      const d = patch.d ?? day
      if (y && m && d) {
        store.setField(
          'birthday',
          `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
        )
      } else {
        store.setField('birthday', [y, m, d].filter(Boolean).join('-'))
      }
    },
    [store, year, month, day],
  )

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 80 }, (_, i) => `${current - 13 - i}`)
  }, [])

  const selectClass =
    'h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'

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
            <select
              {...aria}
              className={selectClass}
              value={day}
              onChange={(e) => update({ d: e.target.value })}
            >
              <option value="">—</option>
              {Array.from({ length: 31 }, (_, i) => `${i + 1}`).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </FieldRow>
        <FieldRow label={t`Mes`} className="flex-[1.4]">
          {(aria) => (
            <select
              {...aria}
              className={selectClass}
              value={month}
              onChange={(e) => update({ m: e.target.value })}
            >
              <option value="">—</option>
              {MONTHS.map((name, i) => (
                <option key={name} value={`${i + 1}`}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </FieldRow>
        <FieldRow label={t`Año`} className="flex-1">
          {(aria) => (
            <select
              {...aria}
              className={selectClass}
              value={year}
              onChange={(e) => update({ y: e.target.value })}
            >
              <option value="">—</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
