import { t } from '@lingui/core/macro'
import { Sprout, TrendingUp, Award, Star, Flame, Crown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  OnboardingSectionTitle,
  OnboardingTierCard,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'
import type { CreatorOnboardingPayloadTier as Tier } from '#/shared/api/generated/model/creatorOnboardingPayloadTier'
import { CreatorOnboardingPayloadTier } from '#/shared/api/generated/model/creatorOnboardingPayloadTier'

const TIER_OPTIONS: {
  value: Tier
  label: () => string
  description: () => string
  icon: LucideIcon
}[] = [
  {
    value: CreatorOnboardingPayloadTier.emergent,
    label: () => t`Emergente`,
    description: () => t`Recién empezando, menos de 10K seguidores.`,
    icon: Sprout,
  },
  {
    value: CreatorOnboardingPayloadTier.growing,
    label: () => t`En crecimiento`,
    description: () => t`Entre 10K y 50K seguidores.`,
    icon: TrendingUp,
  },
  {
    value: CreatorOnboardingPayloadTier.consolidated,
    label: () => t`Consolidado`,
    description: () => t`Entre 50K y 200K seguidores.`,
    icon: Award,
  },
  {
    value: CreatorOnboardingPayloadTier.reference,
    label: () => t`Referente`,
    description: () => t`Entre 200K y 500K seguidores.`,
    icon: Star,
  },
  {
    value: CreatorOnboardingPayloadTier.massive,
    label: () => t`Masivo`,
    description: () => t`Entre 500K y 1M seguidores.`,
    icon: Flame,
  },
  {
    value: CreatorOnboardingPayloadTier.celebrity,
    label: () => t`Celebrity`,
    description: () => t`Más de 1M seguidores.`,
    icon: Crown,
  },
]

export function C4TierScreen() {
  const store = useCreatorOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿En qué nivel estás?`}
        subtitle={t`Elegí el tier que mejor describe tu alcance actual.`}
      />
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label={t`Tier`}
      >
        {TIER_OPTIONS.map((o) => (
          <OnboardingTierCard
            key={o.value}
            label={o.label()}
            description={o.description()}
            icon={o.icon}
            selected={store.tier === o.value}
            onToggle={() => store.setField('tier', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
