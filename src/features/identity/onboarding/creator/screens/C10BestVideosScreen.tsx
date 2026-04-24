import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingField,
  OnboardingOptionChip,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'
import type { BestVideo } from '#/shared/api/generated/model/bestVideo'

const DEFAULT_VIDEOS: BestVideo[] = [
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
]

export function C10BestVideosScreen() {
  const store = useCreatorOnboardingStore()
  const videos: BestVideo[] =
    store.best_videos && store.best_videos.length === 3
      ? store.best_videos
      : DEFAULT_VIDEOS

  const updateVideo = useCallback(
    (index: number, patch: Partial<BestVideo>) => {
      const next = videos.map((v, i) => (i === index ? { ...v, ...patch } : v))
      store.setField('best_videos', next)
    },
    [store, videos],
  )

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`Tus 3 mejores videos`}
        subtitle={t`Compartí los links de tus mejores contenidos para que las marcas vean tu trabajo.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        {videos.map((video, i) => (
          <div key={i} className="flex flex-col gap-3">
            <OnboardingField label={t`Video ${i + 1}`}>
              <Input
                value={video.url}
                onChange={(e) => updateVideo(i, { url: e.target.value })}
                placeholder="https://..."
                maxLength={500}
              />
            </OnboardingField>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label={t`Tipo de video ${i + 1}`}
            >
              <OnboardingOptionChip
                label={t`Orgánico`}
                role="radio"
                selected={video.kind === 'organic'}
                onToggle={() => updateVideo(i, { kind: 'organic' })}
              />
              <OnboardingOptionChip
                label={t`Branded`}
                role="radio"
                selected={video.kind === 'branded'}
                onToggle={() => updateVideo(i, { kind: 'branded' })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
