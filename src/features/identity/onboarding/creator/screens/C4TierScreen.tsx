import { t } from '@lingui/core/macro'
import {
  User,
  TrendingUp,
  Star,
  BadgeCheck,
  Megaphone,
  Crown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OnboardingTierCard } from '#/features/identity/onboarding/shared/components'
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
    description: () => t`1K–5K followers`,
    icon: User,
  },
  {
    value: CreatorOnboardingPayloadTier.growing,
    label: () => t`Creciendo`,
    description: () => t`5K–20K followers`,
    icon: TrendingUp,
  },
  {
    value: CreatorOnboardingPayloadTier.consolidated,
    label: () => t`Consolidado`,
    description: () => t`20K–100K followers`,
    icon: Star,
  },
  {
    value: CreatorOnboardingPayloadTier.reference,
    label: () => t`Referente`,
    description: () => t`100K–200K followers`,
    icon: BadgeCheck,
  },
  {
    value: CreatorOnboardingPayloadTier.massive,
    label: () => t`Masivo`,
    description: () => t`200K–1M followers`,
    icon: Megaphone,
  },
  {
    value: CreatorOnboardingPayloadTier.celebrity,
    label: () => t`Celebridad`,
    description: () => t`1M+ followers`,
    icon: Crown,
  },
]

export function C4TierScreen() {
  const store = useCreatorOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿En qué nivel estás hoy?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Usamos tu nivel para mostrarte ofertas acordes.`}
        </p>
      </div>
      <div
        className="flex flex-wrap justify-center gap-3"
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
