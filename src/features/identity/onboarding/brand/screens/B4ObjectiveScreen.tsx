import { t } from '@lingui/core/macro'
import { Eye, Target, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'

const OBJECTIVES: {
  value: MarketingObjective
  label: () => string
  sublabel: () => string
  icon: LucideIcon
}[] = [
  {
    value: MarketingObjective.awareness,
    label: () => t`Awareness`,
    sublabel: () => t`Dar a conocer la marca`,
    icon: Eye,
  },
  {
    value: MarketingObjective.performance,
    label: () => t`Performance`,
    sublabel: () => t`Clicks, signups, ventas`,
    icon: Target,
  },
  {
    value: MarketingObjective.launch,
    label: () => t`Lanzamiento`,
    sublabel: () => t`Estrenar producto o campaña`,
    icon: Rocket,
  },
  {
    value: MarketingObjective.community,
    label: () => t`Comunidad`,
    sublabel: () => t`Construir base de fans`,
    icon: Users,
  },
]

export function B4ObjectiveScreen() {
  const store = useBrandOnboardingStore()
  const brandName = store.name?.trim()

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {brandName
            ? t`¿Qué objetivo tiene ${brandName} usando Marz?`
            : t`¿Qué objetivo tenés usando Marz?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Tu objetivo define a quién te mostramos y qué scripts te armamos.`}
        </p>
      </div>

      <div
        className="flex flex-wrap justify-center gap-4"
        role="radiogroup"
        aria-label={t`Objetivo principal`}
      >
        {OBJECTIVES.map((o) => {
          const selected = store.marketing_objective === o.value
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => store.setField('marketing_objective', o.value)}
              className={cn(
                'flex h-[180px] w-[220px] flex-col justify-between rounded-[20px] p-6 text-left transition-colors',
                selected
                  ? 'border-2 border-primary bg-primary/10'
                  : 'border border-border bg-card hover:bg-surface-hover',
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-[10px]',
                  selected ? 'bg-primary' : 'bg-muted',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    selected ? 'text-primary-foreground' : 'text-foreground',
                  )}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {o.label()}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {o.sublabel()}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
