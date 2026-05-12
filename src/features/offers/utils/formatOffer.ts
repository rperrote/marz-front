import { t } from '@lingui/core/macro'

export function deadlineToRFC3339(deadline: string): string {
  return `${deadline}T00:00:00Z`
}

export function formatOfferDeadline(deadline: string): string {
  const raw = deadline.includes('T') ? deadline : `${deadline}T00:00:00`
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatOfferPlatform(platform: string, format: string): string {
  const platformLabels: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  }
  const formatLabels: Record<string, string> = {
    yt_long: 'Video',
    yt_short: 'Short',
    ig_reel: 'Reel',
    ig_story: 'Story',
    ig_post: 'Post',
    tiktok_post: 'Post',
  }
  const p = platformLabels[platform] ?? platform
  const f = formatLabels[format] ?? format
  return `${p} ${f}`
}

export function formatExpiresIn(expiresAt: string, now: Date): string {
  const diff = new Date(expiresAt).getTime() - now.getTime()
  if (diff <= 0) return t`Expired`
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return t`${days}d ${hours}h left`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return t`${hours}h ${minutes}m left`
  return t`${minutes}m left`
}

export function isOfferExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() <= now.getTime()
}
