import { t } from '@lingui/core/macro'
import { Zap } from 'lucide-react'

const BRANDS = ['Fintech', 'SaaS', 'Gaming', 'E-commerce', 'Beauty']
const TOTAL = 142

export function C3PrimingBrandsWaiting() {
  const remaining = TOTAL - BRANDS.length

  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-150px] h-[500px] w-[680px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <Zap className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Feed activo ahora mismo`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Hay ${TOTAL} marcas buscando creadores esta semana.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Fintech, SaaS, gaming, lifestyle, beauty — categorías activas.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4">
        {BRANDS.map((b) => (
          <div
            key={b}
            className="flex size-[120px] items-center justify-center rounded-[20px] border border-border bg-card"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {b}
            </span>
          </div>
        ))}
        <div className="flex size-[120px] items-center justify-center rounded-[20px] border border-primary bg-primary/10">
          <span className="text-xs font-semibold text-primary">
            {t`+${remaining} más`}
          </span>
        </div>
      </div>
    </div>
  )
}
