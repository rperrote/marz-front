import { t } from '@lingui/core/macro'

export function formatOfferAmount(amount: string, currency: string): string {
  const num = parseFloat(amount)
  if (Number.isNaN(num)) return `${currency} ${amount}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatOfferDeadline(deadline: string): string {
  const date = new Date(deadline + 'T00:00:00')
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
