import { useEffect, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Check } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'
import { Vertical } from '#/shared/api/generated/model/vertical'
import { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'
import { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'

const VERTICAL_LABEL: Record<Vertical, () => string> = {
  fintech: () => t`Fintech`,
  tech: () => t`Tech`,
  ecommerce: () => t`E-commerce`,
  education: () => t`Educación`,
  food: () => t`Comida`,
  fitness: () => t`Fitness`,
  health: () => t`Salud`,
  entertainment: () => t`Entretenimiento`,
  beauty: () => t`Belleza`,
  gaming: () => t`Gaming`,
  travel: () => t`Viajes`,
  fashion: () => t`Moda`,
  mobile_apps: () => t`Apps móviles`,
  crypto: () => t`Crypto`,
  ai_tech: () => t`AI / Tech`,
  other: () => t`tu vertical`,
}

const BUDGET_LABEL: Record<MonthlyBudgetRange, string> = {
  zero: '$0',
  under_10k: '$10K',
  '10k_to_25k': '$25K',
  '25k_to_50k': '$50K',
  '50k_plus': '$100K+',
}

const OBJECTIVE_LABEL: Record<MarketingObjective, () => string> = {
  awareness: () => t`awareness`,
  performance: () => t`performance`,
  launch: () => t`lanzamiento`,
  community: () => t`comunidad`,
}

const STEP_INTERVAL = 700

export function B12LoadingScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()
  const [completedCount, setCompletedCount] = useState(0)

  const vertical = store.vertical ?? Vertical.other
  const budget = store.monthly_budget_range ?? MonthlyBudgetRange.under_10k
  const objective = store.marketing_objective ?? MarketingObjective.performance

  const steps = [
    t`Filtramos por vertical ${VERTICAL_LABEL[vertical]()}`,
    t`Cruzamos con tu budget de ${BUDGET_LABEL[budget]}`,
    t`Ordenamos por ${OBJECTIVE_LABEL[objective]()} histórico`,
    t`Personalizando tu plan`,
  ]

  useEffect(() => {
    if (completedCount >= steps.length) {
      const timer = setTimeout(() => {
        const currentIndex = STEPS.findIndex((s) => s.id === 'loading')
        if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
          const nextIndex = currentIndex + 1
          store.goTo(nextIndex)
          void navigate({
            to: '/onboarding/brand/$step',
            params: { step: getStepId(nextIndex) },
          })
        }
      }, 500)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      setCompletedCount((c) => c + 1)
    }, STEP_INTERVAL)
    return () => clearTimeout(timer)
  }, [completedCount, navigate, store, steps.length])

  return (
    <div className="relative flex w-full flex-col items-center gap-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[600px] w-[640px] -translate-x-1/2 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.33) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div
        className="relative size-[120px] rounded-full bg-primary"
        style={{ boxShadow: '0 0 60px 10px rgba(13, 166, 120, 0.4)' }}
      >
        <div
          className="absolute size-[60px] rounded-full bg-background opacity-20"
          style={{ left: 30, top: 30 }}
        />
        <div
          className="absolute size-[30px] rounded-full bg-background opacity-40"
          style={{ left: 45, top: 45 }}
        />
      </div>

      <div className="relative flex w-full max-w-[640px] flex-col items-center gap-3.5">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Armando tu shortlist…`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Estamos cruzando tu perfil con 2.340 creadores activos.`}
        </p>
      </div>

      <ol
        className="relative flex w-full max-w-[420px] flex-col gap-3.5"
        aria-live="polite"
      >
        {steps.map((label, i) => {
          const status: 'done' | 'current' | 'pending' =
            i < completedCount
              ? 'done'
              : i === completedCount
                ? 'current'
                : 'pending'
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3.5 transition-opacity',
                status === 'pending' && 'opacity-40',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  status === 'done' && 'bg-primary',
                  status === 'current' && 'bg-primary',
                  status === 'pending' &&
                    'border border-muted-foreground/40 bg-muted',
                )}
              >
                {status === 'done' && (
                  <Check className="size-4 text-primary-foreground" />
                )}
                {status === 'current' && (
                  <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
                )}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  status === 'pending'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
