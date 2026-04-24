import { t } from '@lingui/core/macro'
import {
  Video,
  Camera,
  Mic,
  PenTool,
  Clapperboard,
  Sparkles,
  MonitorPlay,
  Radio,
  BookOpen,
  Megaphone,
  Film,
  ImageIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  OnboardingSectionTitle,
  OnboardingContentTypeChip,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const CONTENT_TYPE_OPTIONS: {
  value: string
  label: () => string
  icon: LucideIcon
}[] = [
  { value: 'short_video', label: () => t`Video corto`, icon: Video },
  { value: 'long_video', label: () => t`Video largo`, icon: MonitorPlay },
  { value: 'reel', label: () => t`Reel`, icon: Clapperboard },
  { value: 'story', label: () => t`Story`, icon: Sparkles },
  { value: 'photo', label: () => t`Foto`, icon: Camera },
  { value: 'carousel', label: () => t`Carrusel`, icon: ImageIcon },
  { value: 'podcast', label: () => t`Podcast`, icon: Mic },
  { value: 'livestream', label: () => t`Livestream`, icon: Radio },
  { value: 'blog', label: () => t`Blog / Artículo`, icon: BookOpen },
  { value: 'ugc', label: () => t`UGC`, icon: Film },
  { value: 'review', label: () => t`Review`, icon: PenTool },
  { value: 'shoutout', label: () => t`Shoutout / Mención`, icon: Megaphone },
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
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Qué tipo de contenido creás?`}
        subtitle={t`Seleccioná todos los que apliquen.`}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
    </div>
  )
}
