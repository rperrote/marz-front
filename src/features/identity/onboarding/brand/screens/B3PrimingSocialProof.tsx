import { t } from '@lingui/core/macro'

export function B3PrimingSocialProof() {
  return (
    <div className="relative flex w-full flex-col items-center gap-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-100px] h-[500px] w-[600px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.2) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Marcas de fintech ya trabajan con Marz`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[52px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Acá no entrás solo.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Cinco años potenciando marcas con creadores de contenido.`}
        </p>
      </div>

      <div className="relative flex items-stretch gap-[60px]">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-primary">
            +$1M
          </span>
          <span className="text-xs text-muted-foreground">
            {t`USD manejados en campañas`}
          </span>
        </div>

        <div
          className="w-px self-center bg-foreground/10"
          style={{ height: 100 }}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-foreground">
            +500M
          </span>
          <span className="text-xs text-muted-foreground">
            {t`views generados`}
          </span>
        </div>

        <div
          className="w-px self-center bg-foreground/10"
          style={{ height: 100 }}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-foreground">
            {t`5 años`}
          </span>
          <span className="text-xs text-muted-foreground">
            {t`liderando campañas`}
          </span>
        </div>
      </div>
    </div>
  )
}
