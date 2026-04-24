import { t } from '@lingui/core/macro'
import {
  Landmark,
  Cpu,
  ShoppingCart,
  GraduationCap,
  UtensilsCrossed,
  Dumbbell,
  HeartPulse,
  Film,
  Sparkles,
  Gamepad2,
  Plane,
  Shirt,
  Smartphone,
  Bitcoin,
  Brain,
  MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  OnboardingSectionTitle,
  OnboardingVerticalCard,
} from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { Vertical } from '#/shared/api/generated/model/vertical'

const VERTICALS: { value: Vertical; label: () => string; icon: LucideIcon }[] =
  [
    { value: Vertical.fintech, label: () => t`Fintech`, icon: Landmark },
    { value: Vertical.tech, label: () => t`Tech`, icon: Cpu },
    {
      value: Vertical.ecommerce,
      label: () => t`E-commerce`,
      icon: ShoppingCart,
    },
    {
      value: Vertical.education,
      label: () => t`Educación`,
      icon: GraduationCap,
    },
    { value: Vertical.food, label: () => t`Comida`, icon: UtensilsCrossed },
    { value: Vertical.fitness, label: () => t`Fitness`, icon: Dumbbell },
    { value: Vertical.health, label: () => t`Salud`, icon: HeartPulse },
    {
      value: Vertical.entertainment,
      label: () => t`Entretenimiento`,
      icon: Film,
    },
    { value: Vertical.beauty, label: () => t`Belleza`, icon: Sparkles },
    { value: Vertical.gaming, label: () => t`Gaming`, icon: Gamepad2 },
    { value: Vertical.travel, label: () => t`Viajes`, icon: Plane },
    { value: Vertical.fashion, label: () => t`Moda`, icon: Shirt },
    {
      value: Vertical.mobile_apps,
      label: () => t`Apps móviles`,
      icon: Smartphone,
    },
    { value: Vertical.crypto, label: () => t`Crypto`, icon: Bitcoin },
    { value: Vertical.ai_tech, label: () => t`AI / Tech`, icon: Brain },
    { value: Vertical.other, label: () => t`Otro`, icon: MoreHorizontal },
  ]

export function B2VerticalScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿En qué vertical opera tu marca?`}
        subtitle={t`Elegí la categoría que mejor represente tu industria.`}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {VERTICALS.map((v) => (
          <OnboardingVerticalCard
            key={v.value}
            label={v.label()}
            icon={v.icon}
            selected={store.vertical === v.value}
            onToggle={() => store.setField('vertical', v.value)}
          />
        ))}
      </div>
    </div>
  )
}
