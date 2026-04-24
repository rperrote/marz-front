import { t } from '@lingui/core/macro'
import { Quote } from 'lucide-react'

export function C19PrimingSocialProof() {
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

      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Quote className="size-6 text-primary" />
      </div>

      <div className="relative flex w-full max-w-[640px] flex-col gap-5 rounded-3xl border border-border bg-card p-8">
        <p className="text-base leading-[1.6] text-foreground">
          {t`“Entré con 60K en TikTok. En 4 meses cerré 11 colabs con marcas fintech y pasé a vivir de esto. La diferencia fue el matching, no tener que buscar yo.”`}
        </p>
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: '#A855F7' }}
          >
            <span className="text-[11px] font-bold text-white">VM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              Valentina Medina
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t`@valenmed · 190K TikTok · 3 años en Marz`}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-12">
        <Stat value="2.340" label={t`creadores activos`} />
        <Stat value="24h" label={t`payout promedio`} />
        <Stat value="0%" label={t`take rate`} />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tracking-[-0.02em] text-foreground">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
