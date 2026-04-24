import { t } from '@lingui/core/macro'
import { cn } from '#/lib/utils'
import { useCreatorOnboardingStore } from '../store'
import type { CreatorOnboardingPayloadExperienceLevel as ExperienceLevel } from '#/shared/api/generated/model/creatorOnboardingPayloadExperienceLevel'
import { CreatorOnboardingPayloadExperienceLevel } from '#/shared/api/generated/model/creatorOnboardingPayloadExperienceLevel'

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: () => string }[] = [
  {
    value: CreatorOnboardingPayloadExperienceLevel.none,
    label: () => t`Nunca trabajé con marcas`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['1_to_5'],
    label: () => t`Hice 1–5 campañas`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['6_to_20'],
    label: () => t`Hice 6–20 campañas`,
  },
  {
    value: CreatorOnboardingPayloadExperienceLevel['20_plus_primary'],
    label: () => t`+20 campañas · es mi ingreso principal`,
  },
]

export function C2ExperienceScreen() {
  const store = useCreatorOnboardingStore()
  const firstName = store.display_name?.trim().split(/\s+/)[0]

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {firstName
            ? t`${firstName}, ¿cuánto hiciste con marcas?`
            : t`¿Cuánto hiciste con marcas?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Esto nos ayuda a matchearte con marcas del nivel correcto.`}
        </p>
      </div>

      <div
        className="flex w-full max-w-[480px] flex-col gap-2.5"
        role="radiogroup"
        aria-label={t`Nivel de experiencia`}
      >
        {EXPERIENCE_OPTIONS.map((o) => {
          const selected = store.experience_level === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => store.setField('experience_level', o.value)}
              className={cn(
                'flex h-[60px] w-full items-center gap-3.5 rounded-2xl px-5 text-left transition-colors',
                selected
                  ? 'border-2 border-primary bg-primary/10'
                  : 'border border-border bg-card hover:bg-surface-hover',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'size-4 shrink-0 rounded-full',
                  selected
                    ? 'bg-primary'
                    : 'border-[1.5px] border-muted-foreground/40',
                )}
              />
              <span
                className={cn(
                  'text-sm text-foreground',
                  selected ? 'font-semibold' : 'font-medium',
                )}
              >
                {o.label()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
