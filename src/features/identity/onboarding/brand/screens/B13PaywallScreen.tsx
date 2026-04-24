import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'
import type { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'

type PlanId = 'starter' | 'growth' | 'scale' | 'custom'

interface PlanStat {
  label: string
  value: string
  highlight?: boolean
}

interface Plan {
  id: PlanId
  tag: string
  name: string
  tagline: string
  price: number | null
  priceLabel?: string
  stats: PlanStat[]
  features: string[]
  ctaLabel: string
  ctaVariant: 'primary' | 'outline'
  borderHighlight?: boolean
  bgOverride?: string
}

function getPlans(): Plan[] {
  return [
    {
      id: 'starter',
      tag: 'ESSENTIALS',
      name: 'Starter',
      tagline: t`Accedé a la red de creadores de Marz.`,
      price: 199,
      stats: [
        { label: t`CAMPAÑAS`, value: '1' },
        { label: t`HIRES`, value: '5' },
        { label: t`INVITES`, value: t`30/mes`, highlight: true },
        { label: t`PAYOUTS`, value: '24h' },
      ],
      features: [
        t`Red de creadores`,
        t`AI matching + outreach`,
        t`Script Lab básico`,
        t`Payouts automáticos 24h`,
        t`Métricas 30 días`,
        t`Soporte por email`,
      ],
      ctaLabel: t`Probar 7 días gratis`,
      ctaVariant: 'outline',
    },
    {
      id: 'growth',
      tag: 'FOR GROWTH TEAMS',
      name: 'Growth',
      tagline: t`El plan que eligen equipos que miden creadores como canal performance.`,
      price: 299,
      stats: [
        { label: t`CAMPAÑAS`, value: '3' },
        { label: t`HIRES`, value: '15' },
        { label: t`INVITES`, value: t`100/mes`, highlight: true },
        { label: t`PAYOUTS`, value: '24h' },
      ],
      features: [
        t`Todo lo de Starter, +:`,
        t`Script Lab completo`,
        t`A/B testing`,
        t`Content review workflow`,
        t`Métricas ilimitadas`,
        t`Reasignación automática`,
      ],
      ctaLabel: t`Probar 7 días gratis`,
      ctaVariant: 'primary',
      borderHighlight: true,
    },
    {
      id: 'scale',
      tag: 'HIGH VOLUME',
      name: 'Scale',
      tagline: t`Para equipos que gastan $10K+/mes y necesitan control total.`,
      price: 999,
      stats: [
        { label: t`CAMPAÑAS`, value: '∞', highlight: true },
        { label: t`HIRES`, value: '∞', highlight: true },
        { label: t`INVITES`, value: '∞', highlight: true },
        { label: t`PAYOUTS`, value: '24h' },
      ],
      features: [
        t`Todo lo de Growth, +:`,
        t`Account manager dedicado`,
        t`Attribution / ROAS`,
        t`Reportes custom`,
        t`Acceso API`,
        t`Soporte 24/7`,
      ],
      ctaLabel: t`Hablar con ventas`,
      ctaVariant: 'outline',
    },
    {
      id: 'custom',
      tag: 'WHITE GLOVE',
      name: 'Custom',
      tagline: t`Marz lo opera todo. Vos aprobás, nosotros ejecutamos.`,
      price: null,
      priceLabel: t`Hablemos`,
      stats: [
        { label: t`CAMPAÑAS`, value: '∞', highlight: true },
        { label: t`VOS HACÉS`, value: t`Nada`, highlight: true },
        { label: t`CREADORES`, value: '∞', highlight: true },
        { label: t`PAYOUTS`, value: '24h' },
      ],
      features: [
        t`Todo lo de Scale, +:`,
        t`Equipo Marz dedicado`,
        t`Estrategia + curaduría`,
        t`Scripts + QA`,
        t`Reportes semanales`,
        t`SLA custom`,
      ],
      ctaLabel: t`Agendar una llamada`,
      ctaVariant: 'outline',
      bgOverride: '#1F1F22',
    },
  ]
}

function getRecommendedPlan(budget: MonthlyBudgetRange | undefined): PlanId {
  if (!budget || budget === 'zero' || budget === 'under_10k') return 'starter'
  if (budget === '10k_to_25k') return 'growth'
  if (budget === '25k_to_50k') return 'scale'
  return 'custom'
}

export function B13PaywallScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  const plans = getPlans()
  const recommended = getRecommendedPlan(store.monthly_budget_range)
  const firstName = store.contact_name?.trim().split(/\s+/)[0]

  const handleSkip = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === 'paywall')
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1
      store.goTo(nextIndex)
      void navigate({
        to: '/onboarding/brand/$step',
        params: { step: getStepId(nextIndex) },
      })
    }
  }

  return (
    <div className="relative flex w-full flex-col items-center gap-5">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[500px] w-[640px] -translate-x-1/2 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-2">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {firstName ? t`Elegí tu plan, ${firstName}.` : t`Elegí tu plan.`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Sin take rate. Sin letra chica. Trial de 7 días en Starter y Growth.`}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t`Facturación`}
        className="relative flex h-10 items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={billing === 'monthly'}
          onClick={() => setBilling('monthly')}
          className={cn(
            'flex h-8 items-center rounded-full px-4 text-[11px] font-semibold transition-colors',
            billing === 'monthly'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground',
          )}
        >
          {t`Mensual`}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={billing === 'annual'}
          onClick={() => setBilling('annual')}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-full px-4 text-[11px] transition-colors',
            billing === 'annual'
              ? 'bg-foreground font-semibold text-background'
              : 'text-muted-foreground',
          )}
        >
          {t`Anual`}
          <span className="font-semibold text-primary">-20%</span>
        </button>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            recommended={plan.id === recommended}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="relative text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t`Prefiero seguir sin acceso a la red de creadores →`}
      </button>
    </div>
  )
}

function PlanCard({
  plan,
  billing,
  recommended,
}: {
  plan: Plan
  billing: 'monthly' | 'annual'
  recommended: boolean
}) {
  const displayPrice =
    plan.price != null
      ? billing === 'annual'
        ? Math.round(plan.price * 0.8)
        : plan.price
      : null

  return (
    <div
      className={cn(
        'relative flex w-[260px] flex-col gap-[18px] rounded-[20px] p-6',
        plan.borderHighlight
          ? 'border-2 border-primary'
          : 'border border-border',
      )}
      style={plan.bgOverride ? { backgroundColor: plan.bgOverride } : undefined}
    >
      {!plan.bgOverride && (
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] bg-card" />
      )}

      {recommended && (
        <div className="absolute left-1/2 top-0 flex h-[26px] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-primary bg-background px-3.5">
          <span className="size-[5px] rounded-full bg-primary" />
          <span className="text-[10px] font-semibold tracking-[0.08em] text-primary">
            {t`RECOMENDADO PARA VOS`}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span
          className={cn(
            'text-[11px] font-semibold tracking-[0.08em]',
            plan.borderHighlight ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {plan.tag}
        </span>
        <span className="text-lg font-bold text-foreground">{plan.name}</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-0.5">
          {displayPrice != null ? (
            <>
              <span className="text-lg font-bold text-foreground">$</span>
              <span className="text-[40px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
                {displayPrice}
              </span>
              <span className="pb-2 pl-1 text-xs font-medium text-muted-foreground">
                {billing === 'annual' ? t`/mo · anual` : t`/mo`}
              </span>
            </>
          ) : (
            <span className="text-[26px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
              {plan.priceLabel}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-primary">
          {plan.price != null ? t`Sin take rate` : t`Servicio fully managed`}
        </span>
      </div>

      <p className="text-[11px] leading-[1.5] text-muted-foreground">
        {plan.tagline}
      </p>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <button
                type="button"
                disabled
                className={cn(
                  'flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70',
                  plan.ctaVariant === 'primary'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground',
                )}
              >
                {plan.ctaLabel}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t`Próximamente`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          {plan.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-0.5 rounded-lg bg-muted p-2.5"
            >
              <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground">
                {stat.label}
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  stat.highlight ? 'text-primary' : 'text-foreground',
                )}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground">
          {t`INCLUYE`}
        </span>
        <ul className="flex flex-col gap-1.5">
          {plan.features.map((feat) => (
            <li
              key={feat}
              className="flex items-center gap-2 text-[11px] text-muted-foreground"
            >
              <Check className="size-3 shrink-0 text-primary" />
              {feat}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
