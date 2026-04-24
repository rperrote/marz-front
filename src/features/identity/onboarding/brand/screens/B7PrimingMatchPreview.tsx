import { t } from '@lingui/core/macro'
import { Sparkles } from 'lucide-react'
import { useBrandOnboardingStore } from '../store'
import { Vertical } from '#/shared/api/generated/model/vertical'
import type { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'
import type { MonthlyBudgetRange } from '#/shared/api/generated/model/monthlyBudgetRange'

const TOTAL_CREATORS = 350

const BLOB_COLORS = [
  '#3B82F6',
  '#F59E0B',
  '#A855F7',
  '#EC4899',
  '#22C55E',
  '#0DA678',
] as const

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
  other: () => t`Tu vertical`,
}

const OBJECTIVE_LABEL: Record<MarketingObjective, () => string> = {
  awareness: () => t`Awareness`,
  performance: () => t`Performance`,
  launch: () => t`Lanzamiento`,
  community: () => t`Comunidad`,
}

const BUDGET_LABEL: Record<MonthlyBudgetRange, string> = {
  zero: '$0',
  under_10k: '$10K',
  '10k_to_25k': '$25K',
  '25k_to_50k': '$50K',
  '50k_plus': '$100K+',
}

const VERTICAL_NICHES: Record<Vertical, () => string[]> = {
  fintech: () => [
    t`Fintech`,
    t`Negocios`,
    t`Tech LatAm`,
    t`Lifestyle`,
    t`Inversión`,
  ],
  tech: () => [t`Tech`, t`Productividad`, t`Dev`, t`AI`, t`Startups`],
  ecommerce: () => [
    t`E-commerce`,
    t`Lifestyle`,
    t`Deals`,
    t`Reviews`,
    t`Unboxing`,
  ],
  education: () => [
    t`Educación`,
    t`Estudio`,
    t`Idiomas`,
    t`Carrera`,
    t`Skills`,
  ],
  food: () => [t`Comida`, t`Recetas`, t`Foodie`, t`Restaurantes`, t`Bebidas`],
  fitness: () => [t`Fitness`, t`Gym`, t`Nutrición`, t`Wellness`, t`Running`],
  health: () => [
    t`Salud`,
    t`Wellness`,
    t`Mindfulness`,
    t`Nutrición`,
    t`Mental`,
  ],
  entertainment: () => [
    t`Entretenimiento`,
    t`Cine`,
    t`Música`,
    t`Reviews`,
    t`Comedia`,
  ],
  beauty: () => [t`Belleza`, t`Skincare`, t`Makeup`, t`Cabello`, t`Lifestyle`],
  gaming: () => [
    t`Gaming`,
    t`Esports`,
    t`Streaming`,
    t`Reviews`,
    t`Mobile games`,
  ],
  travel: () => [
    t`Viajes`,
    t`Turismo`,
    t`Aventura`,
    t`Lifestyle`,
    t`Gastronomía`,
  ],
  fashion: () => [t`Moda`, t`Streetwear`, t`Lifestyle`, t`Lujo`, t`Tendencias`],
  mobile_apps: () => [
    t`Apps`,
    t`Tech`,
    t`Productividad`,
    t`Reviews`,
    t`Lifestyle`,
  ],
  crypto: () => [t`Crypto`, t`Trading`, t`Web3`, t`DeFi`, t`Finanzas`],
  ai_tech: () => [t`AI`, t`Tech`, t`Productividad`, t`Startups`, t`Dev`],
  other: () => [
    t`Lifestyle`,
    t`Tech`,
    t`Negocios`,
    t`Entretenimiento`,
    t`Cultura`,
  ],
}

export function B7PrimingMatchPreview() {
  const store = useBrandOnboardingStore()
  const vertical = store.vertical ?? Vertical.other
  const niches = VERTICAL_NICHES[vertical]()

  const chips: string[] = [VERTICAL_LABEL[vertical]()]
  if (store.monthly_budget_range) {
    chips.push(t`Budget ${BUDGET_LABEL[store.monthly_budget_range]}`)
  }
  if (store.marketing_objective) {
    chips.push(OBJECTIVE_LABEL[store.marketing_objective]())
  }
  chips.push(t`LatAm`)

  const remaining = TOTAL_CREATORS - niches.length - 1

  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-150px] h-[500px] w-[680px] -translate-x-1/2 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <Sparkles className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Matching pre-calculado con tu vertical`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Ya tenemos ${TOTAL_CREATORS} creadores que encajan con tu marca.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {chips.join(' · ')}
          {t`. Te los mostramos cuando termines.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-3">
        {niches.map((label, i) => (
          <div
            key={label}
            className="flex h-[150px] w-[120px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-border bg-card p-4"
          >
            <div
              className="size-14 rounded-full"
              style={{ backgroundColor: BLOB_COLORS[i], filter: 'blur(8px)' }}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
        <div className="flex h-[150px] w-[120px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-border bg-card p-4">
          <div
            className="size-14 rounded-full"
            style={{ backgroundColor: BLOB_COLORS[5], filter: 'blur(8px)' }}
          />
          <span className="text-[11px] font-medium text-muted-foreground">
            {t`+${remaining} más`}
          </span>
        </div>
      </div>
    </div>
  )
}
