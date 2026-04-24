import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { Slider } from '#/components/ui/slider'
import { cn } from '#/lib/utils'

const TICKS = [1, 4, 8, 12]
const AVG_PER_COLLAB = 600

export function C18PrimingEarnings() {
  const [collabs, setCollabs] = useState(4)

  const low = Math.round(collabs * AVG_PER_COLLAB)
  const high = Math.round(collabs * AVG_PER_COLLAB * 2)

  return (
    <div className="relative flex w-full flex-col items-center gap-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[560px] w-[720px] -translate-x-1/2 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.33) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <p className="text-center text-lg font-medium text-muted-foreground">
          {t`Podés ganar hasta`}
        </p>
        <div className="flex items-end gap-1.5">
          <span className="text-[96px] font-bold leading-[1.2] tracking-[-0.02em] text-primary">
            ${low.toLocaleString('es-AR')} – ${high.toLocaleString('es-AR')}
          </span>
          <span className="pb-6 text-[22px] font-semibold text-muted-foreground">
            {t`USD / mes`}
          </span>
        </div>
        <p className="text-center text-sm leading-[1.5] text-muted-foreground">
          {t`Rango histórico de creadores activos con tu nicho y disponibilidad en los últimos 6 meses.`}
        </p>
      </div>

      <p className="relative max-w-[720px] text-center text-[11px] leading-[1.5] text-muted-foreground">
        {t`Tu tarifa, tu calendario, tu estilo. Nosotros operamos el resto.`}
      </p>

      <div className="relative flex w-full max-w-[720px] items-center gap-7 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {t`Colabs al mes`}
            </span>
            <span className="text-lg font-bold tracking-[-0.02em] text-foreground">
              {collabs}
            </span>
          </div>
          <Slider
            min={1}
            max={12}
            step={1}
            value={[collabs]}
            onValueChange={([v]) => {
              if (v != null) setCollabs(v)
            }}
            aria-label={t`Colabs al mes`}
          />
          <div className="flex justify-between">
            {TICKS.map((tick) => (
              <span
                key={tick}
                className={cn(
                  'text-[10px]',
                  tick === collabs
                    ? 'font-bold text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {tick === 12 ? '12+' : tick}
              </span>
            ))}
          </div>
        </div>
        <div className="h-16 w-px bg-border" />
        <div className="flex w-[240px] flex-col gap-1">
          <span className="text-xs font-semibold leading-[1.5] text-foreground">
            {t`Cobrás $${AVG_PER_COLLAB.toLocaleString('es-AR')} promedio`}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t`por colab en tu nicho`}
          </span>
        </div>
      </div>
    </div>
  )
}
