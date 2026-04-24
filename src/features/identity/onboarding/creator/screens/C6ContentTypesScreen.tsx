import { t } from '@lingui/core/macro'
import {
  PackageOpen,
  Star,
  LayoutTemplate,
  Sparkles,
  BookOpen,
  Megaphone,
  Scissors,
  GraduationCap,
  Mic,
  Laugh,
  Sun,
  Clapperboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OnboardingContentTypeChip } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const CONTENT_TYPE_OPTIONS: {
  value: string
  label: () => string
  icon: LucideIcon
}[] = [
  { value: 'unboxing', label: () => t`Unboxing`, icon: PackageOpen },
  { value: 'reviews', label: () => t`Reviews`, icon: Star },
  {
    value: 'product_demos',
    label: () => t`Product demos`,
    icon: LayoutTemplate,
  },
  { value: 'lifestyle', label: () => t`Lifestyle`, icon: Sparkles },
  { value: 'storytelling', label: () => t`Storytelling`, icon: BookOpen },
  { value: 'video_ads', label: () => t`Video Ads`, icon: Megaphone },
  {
    value: 'faceless_clipping',
    label: () => t`Faceless / Clipping`,
    icon: Scissors,
  },
  { value: 'tutorials', label: () => t`Tutoriales`, icon: GraduationCap },
  { value: 'interviews', label: () => t`Entrevistas`, icon: Mic },
  { value: 'humor_sketches', label: () => t`Humor / Sketches`, icon: Laugh },
  { value: 'day_in_the_life', label: () => t`Day in the life`, icon: Sun },
  {
    value: 'behind_the_scenes',
    label: () => t`Behind the scenes`,
    icon: Clapperboard,
  },
]

export function C6ContentTypesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.content_types ?? []

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      store.setField(
        'content_types',
        selected.filter((v) => v !== value),
      )
    } else {
      store.setField('content_types', [...selected, value])
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Qué tipo de contenido hacés?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas buscan tipos específicos. Marcá los que te salen bien.`}
        </p>
      </div>
      <div className="flex max-w-[800px] flex-wrap justify-center gap-2.5">
        {CONTENT_TYPE_OPTIONS.map((o) => (
          <OnboardingContentTypeChip
            key={o.value}
            label={o.label()}
            icon={o.icon}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        {t`${selected.length} de ${CONTENT_TYPE_OPTIONS.length} seleccionados`}
      </p>
    </div>
  )
}
