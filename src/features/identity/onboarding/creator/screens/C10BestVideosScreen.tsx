import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Play, Plus } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Input } from '#/components/ui/input'
import { useCreatorOnboardingStore } from '../store'
import type { BestVideo } from '#/shared/api/generated/model/bestVideo'

const DEFAULT_VIDEOS: BestVideo[] = [
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
]

const PREVIEW_COLORS = ['#3B82F6', '#A855F7'] as const

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
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`Tus 3 mejores videos`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Sirven para mostrar resultado real a las marcas. Si fueron con marcas, etiquetalos.`}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {videos.map((video, i) => {
          const hasUrl = video.url.trim().length > 0
          const color = PREVIEW_COLORS[i % PREVIEW_COLORS.length]
          return (
            <div
              key={i}
              className={cn(
                'flex w-[200px] flex-col gap-3 rounded-2xl border p-4 transition-colors',
                hasUrl
                  ? 'border-border bg-card'
                  : 'border-dashed border-border bg-card',
              )}
            >
              {hasUrl ? (
                <div
                  className="relative flex h-[240px] items-center justify-center rounded-xl"
                  style={{ backgroundColor: color }}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-black/20">
                    <Play className="size-5 fill-white text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateVideo(i, {
                        kind: video.kind === 'organic' ? 'branded' : 'organic',
                      })
                    }
                    className={cn(
                      'absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
                      video.kind === 'branded'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/70 text-foreground',
                    )}
                  >
                    {video.kind === 'branded' ? t`Brand` : t`UGC`}
                  </button>
                </div>
              ) : (
                <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-xl bg-muted">
                  <div className="flex size-10 items-center justify-center rounded-full bg-background/50">
                    <Plus className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t`Agregar video`}
                  </span>
                </div>
              )}
              <Input
                value={video.url}
                onChange={(e) => updateVideo(i, { url: e.target.value })}
                placeholder={t`URL de IG / TikTok / YT`}
                maxLength={500}
                className="h-9 text-xs"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
