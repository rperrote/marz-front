import { t } from '@lingui/core/macro'
import { Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { Timing } from '#/shared/api/generated/model/timing'

const TIMING_OPTIONS: {
  value: Timing
  label: () => string
  icon?: LucideIcon
}[] = [
  { value: Timing.launch_now, label: () => t`Lanzo ya`, icon: Zap },
  { value: Timing.one_to_two_weeks, label: () => t`En 1–2 semanas` },
  { value: Timing.this_month, label: () => t`Este mes` },
  { value: Timing.exploring, label: () => t`Estoy explorando` },
]

export function B8TimingScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cuándo querés empezar?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Si lanzás ya, priorizamos creadores disponibles esta semana.`}
        </p>
      </div>

      <div
        className="flex flex-wrap justify-center gap-2.5"
        role="radiogroup"
        aria-label={t`Timing`}
      >
        {TIMING_OPTIONS.map((o) => {
          const selected = store.timing === o.value
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => store.setField('timing', o.value)}
              className={cn(
                'flex h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors',
                selected
                  ? 'border-2 border-primary bg-primary/10 font-semibold text-primary'
                  : 'border border-border bg-card font-medium text-foreground hover:bg-surface-hover',
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'size-4',
                    selected ? 'text-primary' : 'text-foreground',
                  )}
                />
              )}
              {o.label()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
