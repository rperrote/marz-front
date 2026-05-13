import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Instagram, Youtube, Link2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Input } from '#/components/ui/input'
import { useCreatorOnboardingStore } from '../store'
import type { BestVideo } from '#/shared/api/generated/model/bestVideo'

const DEFAULT_VIDEOS: BestVideo[] = [
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
  { url: '', kind: 'organic' },
]

const BEST_VIDEO_SLOT_IDS = [
  'first-video',
  'second-video',
  'third-video',
] as const

type Provider = 'youtube' | 'tiktok' | 'instagram'

const YT_SHORT_RE = /^https?:\/\/(www\.)?youtube\.com\/shorts\/([\w-]{6,})/i
const TIKTOK_RE =
  /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|[\w-]{6,})/i
const IG_REEL_RE = /^https?:\/\/(www\.)?instagram\.com\/(reel|reels)\/[\w-]+/i

function detectValidProvider(url: string): Provider | null {
  if (YT_SHORT_RE.test(url)) return 'youtube'
  if (TIKTOK_RE.test(url)) return 'tiktok'
  if (IG_REEL_RE.test(url)) return 'instagram'
  return null
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1.84-.05Z" />
    </svg>
  )
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'instagram') return <Instagram className="size-5" />
  if (provider === 'youtube') return <Youtube className="size-5" />
  return <TikTokIcon className="size-5" />
}

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
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {t`Tus 3 mejores videos`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Pegá links de Reels de Instagram, TikToks o Shorts de YouTube.`}
        </p>
      </div>

      <div className="flex w-full max-w-[640px] flex-col gap-3">
        {videos.map((video, i) => {
          const url = video.url.trim()
          const provider = url.length > 0 ? detectValidProvider(url) : null
          const slotId = BEST_VIDEO_SLOT_IDS[i] ?? `video-${i + 1}`
          return (
            <div
              key={slotId}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                provider
                  ? 'border-border bg-card'
                  : 'border-dashed border-border bg-card',
              )}
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  provider
                    ? 'bg-muted text-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {provider ? (
                  <ProviderIcon provider={provider} />
                ) : (
                  <Link2 className="size-4" />
                )}
              </div>
              <Input
                value={video.url}
                onChange={(e) => updateVideo(i, { url: e.target.value })}
                placeholder={t`URL de IG / TikTok / YT`}
                maxLength={500}
                className="h-9 flex-1 text-sm"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
