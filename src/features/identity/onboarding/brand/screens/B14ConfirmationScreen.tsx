import { t } from '@lingui/core/macro'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { useBrandOnboardingStore } from '../store'
import { useSubmitBrandOnboarding } from '#/features/identity/onboarding/brand/useSubmitBrandOnboarding'
import { Vertical } from '#/shared/api/generated/model/vertical'
import { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'

const VERTICAL_LABEL: Record<Vertical, () => string> = {
  fintech: () => t`fintech`,
  tech: () => t`tech`,
  ecommerce: () => t`e-commerce`,
  education: () => t`educación`,
  food: () => t`comida`,
  fitness: () => t`fitness`,
  health: () => t`salud`,
  entertainment: () => t`entretenimiento`,
  beauty: () => t`belleza`,
  gaming: () => t`gaming`,
  travel: () => t`viajes`,
  fashion: () => t`moda`,
  mobile_apps: () => t`apps móviles`,
  crypto: () => t`crypto`,
  ai_tech: () => t`AI / tech`,
  other: () => t`tu vertical`,
}

const OBJECTIVE_LABEL: Record<MarketingObjective, () => string> = {
  awareness: () => t`awareness`,
  performance: () => t`performance`,
  launch: () => t`lanzamiento`,
  community: () => t`comunidad`,
}

export function B14ConfirmationScreen() {
  const { submit, isPending } = useSubmitBrandOnboarding()
  const store = useBrandOnboardingStore()

  const firstName = store.contact_name?.trim().split(/\s+/)[0]
  const brandName = store.name?.trim() ?? t`Tu marca`
  const vertical = store.vertical ?? Vertical.other
  const objective = store.marketing_objective ?? MarketingObjective.performance

  const steps = [
    {
      title: t`Armá tu primera campaña y brief`,
      sublabel: t`Te ayudamos con un template base para ${VERTICAL_LABEL[vertical]()}`,
    },
    {
      title: t`Revisá tus matchs de creadores`,
      sublabel: t`Filtrados por ${VERTICAL_LABEL[vertical]()} LatAm + ${OBJECTIVE_LABEL[objective]()}`,
    },
    {
      title: t`Enviá tus primeros invites (100 este mes)`,
      sublabel: t`Los que no responden en 72h vuelven a tu cuota`,
    },
  ]

  return (
    <div className="relative flex w-full flex-col items-center gap-9">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-100px] h-[500px] w-[600px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex size-[72px] items-center justify-center rounded-full bg-primary/20">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary">
          <Check className="size-6 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>

      <div className="relative flex w-full max-w-[640px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {firstName ? t`Listo, ${firstName}.` : t`Listo.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`${brandName} está en Marz. Probando gratis durante 7 días.`}
        </p>
      </div>

      <div className="relative flex w-full max-w-[560px] flex-col gap-[18px] rounded-3xl border border-border bg-card p-7">
        <span className="text-sm font-semibold text-foreground">
          {t`Qué sigue ahora`}
        </span>
        <ol className="flex flex-col gap-3.5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {step.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {step.sublabel}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        data-testid="onboarding-start-btn"
        disabled={isPending}
        onClick={submit}
        className="relative flex h-12 items-center gap-2.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {t`Ir al dashboard`}
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </div>
  )
}
