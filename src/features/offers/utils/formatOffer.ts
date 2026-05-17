import { t } from '@lingui/core/macro'

export function formatOfferDeadline(deadline: string): string {
  // eslint-disable-next-line lingui/no-unlocalized-strings
  const raw = deadline.includes('T') ? deadline : `${deadline}T00:00:00`
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatOfferPlatform(platform: string, format: string): string {
  const platformLabels: Record<string, string> = {
    youtube: t`YouTube`,
    instagram: t`Instagram`,
    tiktok: t`TikTok`,
  }
  const formatLabels: Record<string, string> = {
    yt_long: t`Video`,
    yt_short: t`Short`,
    ig_reel: t`Reel`,
    ig_story: t`Story`,
    ig_post: t`Post`,
    tiktok_post: t`Post`,
  }
  const p = platformLabels[platform] ?? platform
  const f = formatLabels[format] ?? format
  return `${p} ${f}`
}
