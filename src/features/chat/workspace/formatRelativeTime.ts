const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const date = new Date(isoDate)
  const diff = now - date.getTime()

  if (diff < HOUR) {
    return `${Math.max(1, Math.floor(diff / MINUTE))}m`
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}h`
  }

  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)}d`
  }

  const month = MONTH_LABELS[date.getMonth()]
  return `${month} ${date.getDate()}`
}
