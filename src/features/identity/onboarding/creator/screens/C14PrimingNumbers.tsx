import { t } from '@lingui/core/macro'
import { Hash } from 'lucide-react'

export function C14PrimingNumbers() {
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
        <Hash className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Últimos datos antes de matchear`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Los números importan.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Completá los últimos datos para que podamos conectarte con las marcas ideales.`}
        </p>
      </div>
    </div>
  )
}
