const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitch: 'Twitch',
  x: 'X',
}

export function formatPlatform(platform: string) {
  return platformLabels[platform] ?? platform
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? '?'
  const second = parts[1]?.charAt(0) ?? ''
  return `${first}${second}`.toUpperCase()
}

export function formatRelativeTime(
  value: string | null,
  fallback: string,
  locale = 'es-AR',
) {
  if (!value) return fallback

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return fallback

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (absSeconds < 60) return formatter.format(diffSeconds, 'second')
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, 'day')
  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, 'month')
  return formatter.format(Math.round(diffMonths / 12), 'year')
}
