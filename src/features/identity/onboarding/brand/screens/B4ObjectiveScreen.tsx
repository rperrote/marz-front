import { t } from '@lingui/core/macro'
import { Eye, TrendingUp, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  OnboardingSectionTitle,
  OnboardingVerticalCard,
} from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { MarketingObjective } from '#/shared/api/generated/model/marketingObjective'

const OBJECTIVES: {
  value: MarketingObjective
  label: () => string
  icon: LucideIcon
}[] = [
  {
    value: MarketingObjective.awareness,
    label: () => t`Brand Awareness`,
    icon: Eye,
  },
  {
    value: MarketingObjective.performance,
    label: () => t`Performance`,
    icon: TrendingUp,
  },
  {
    value: MarketingObjective.launch,
    label: () => t`Lanzamiento`,
    icon: Rocket,
  },
  {
    value: MarketingObjective.community,
    label: () => t`Comunidad`,
    icon: Users,
  },
]

export function B4ObjectiveScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuál es tu objetivo principal?`}
        subtitle={t`Elegí el objetivo que más se alinee con tu estrategia actual.`}
      />
      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVES.map((o) => (
          <OnboardingVerticalCard
            key={o.value}
            label={o.label()}
            icon={o.icon}
            selected={store.marketing_objective === o.value}
            onToggle={() => store.setField('marketing_objective', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
