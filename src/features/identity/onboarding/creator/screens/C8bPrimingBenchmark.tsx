import { t } from '@lingui/core/macro'
import { ShieldCheck } from 'lucide-react'
import { cn } from '#/lib/utils'

interface StatCard {
  label: string
  value: string
  unit?: string
  description: string
  highlighted: boolean
}

export function C8bPrimingBenchmark() {
  const cards: StatCard[] = [
    {
      label: t`COBRO GARANTIZADO`,
      value: '24h',
      description: t`Pago después de aprobar el post. Sin perseguir pagos.`,
      highlighted: false,
    },
    {
      label: t`TU TARIFA, COMPLETA`,
      value: '100',
      unit: '%',
      description: t`Sin managers. Sin comisiones. Sin intermediarios.`,
      highlighted: true,
    },
    {
      label: t`TIEMPO RECUPERADO`,
      value: '+40hs',
      unit: t`/ mes`,
      description: t`Solo recibís campañas que calzan con vos. Cero DMs cruzados.`,
      highlighted: false,
    },
  ]

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
        <ShieldCheck className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Lo que cambia al entrar a Marz`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[780px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Así es trabajar con Marz.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Menos fricción. Más plata. Más tiempo para crear.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              'flex h-[180px] w-[300px] flex-col justify-center gap-2.5 rounded-3xl bg-card p-7',
              card.highlighted
                ? 'border border-primary'
                : 'border border-border',
            )}
          >
            <span
              className={cn(
                'text-[10px] font-semibold tracking-[0.08em]',
                card.highlighted ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {card.label}
            </span>
            <div className="flex items-end gap-1">
              <span
                className={cn(
                  'text-[40px] font-bold leading-[1.2] tracking-[-0.02em]',
                  card.highlighted ? 'text-primary' : 'text-foreground',
                )}
              >
                {card.value}
              </span>
              {card.unit && (
                <span
                  className={cn(
                    'pb-2 text-[15px] font-semibold',
                    card.highlighted ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {card.unit}
                </span>
              )}
            </div>
            <p className="text-[11px] leading-[1.5] text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <p className="relative max-w-[720px] text-center text-[11px] leading-[1.5] text-muted-foreground">
        {t`Tu tarifa, tu calendario, tu estilo. Nosotros operamos el resto.`}
      </p>
    </div>
  )
}
