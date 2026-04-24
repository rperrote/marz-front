import { t } from '@lingui/core/macro'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { CreatorExperience } from '#/shared/api/generated/model/creatorExperience'
import { CreatorSourcingIntent } from '#/shared/api/generated/model/creatorSourcingIntent'

const EXPERIENCE_OPTIONS: {
  value: CreatorExperience
  label: () => string
}[] = [
  { value: CreatorExperience.never, label: () => t`Nunca lo hice` },
  {
    value: CreatorExperience.scaling,
    label: () => t`Lo hago pero quiero escalar`,
  },
  {
    value: CreatorExperience.tried_without_results,
    label: () => t`Probé sin muchos resultados`,
  },
]

const SOURCING_OPTIONS: {
  value: CreatorSourcingIntent
  label: () => string
  sublabel: () => string
}[] = [
  {
    value: CreatorSourcingIntent.already_have,
    label: () => t`Ya tengo mis creadores`,
    sublabel: () => t`Los traigo yo`,
  },
  {
    value: CreatorSourcingIntent.discover_in_marz,
    label: () => t`Quiero descubrirlos en Marz`,
    sublabel: () => t`Acceso a la red completa`,
  },
  {
    value: CreatorSourcingIntent.both,
    label: () => t`Las dos cosas`,
    sublabel: () => t`Traigo algunos y sumo de la red`,
  },
]

interface OptionRowProps {
  selected: boolean
  onSelect: () => void
  label: string
  sublabel?: string
  name: string
}

function OptionRow({
  selected,
  onSelect,
  label,
  sublabel,
  name,
}: OptionRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-[18px] text-left transition-colors',
        sublabel ? 'min-h-14 py-2.5' : 'h-[52px]',
        selected
          ? 'border-2 border-primary bg-primary/10'
          : 'border border-border bg-card hover:bg-surface-hover',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-4 shrink-0 rounded-full',
          selected ? 'bg-primary' : 'border-[1.5px] border-muted-foreground/40',
        )}
      />
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            'text-xs text-foreground',
            selected ? 'font-semibold' : 'font-medium',
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </button>
  )
}

export function B5ExperienceScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`Contanos cómo venís con creadores`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Dos preguntas rápidas. Usamos esto para recomendarte el mejor plan.`}
        </p>
      </div>

      <div className="flex w-full max-w-[620px] flex-col gap-4">
        <div
          className="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label={t`Tu experiencia con creadores`}
        >
          <span className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
            {t`TU EXPERIENCIA CON CREADORES`}
          </span>
          {EXPERIENCE_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              name="creator_experience"
              selected={store.creator_experience === o.value}
              onSelect={() => store.setField('creator_experience', o.value)}
              label={o.label()}
            />
          ))}
        </div>

        <div className="h-px w-full bg-border" />

        <div
          className="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label={t`Origen de creadores`}
        >
          <span className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
            {t`ORIGEN DE CREADORES`}
          </span>
          {SOURCING_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              name="creator_sourcing_intent"
              selected={store.creator_sourcing_intent === o.value}
              onSelect={() =>
                store.setField('creator_sourcing_intent', o.value)
              }
              label={o.label()}
              sublabel={o.sublabel()}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
