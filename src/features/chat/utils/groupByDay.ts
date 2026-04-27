import type { MessageItem } from '../types'

export interface DaySeparatorItem {
  kind: 'day-separator'
  label: string
  date: string
}

export interface MessageTimelineItem {
  kind: 'message'
  message: MessageItem
}

export type TimelineItem = DaySeparatorItem | MessageTimelineItem

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

function formatDayLabel(date: Date, today: Date): string {
  const todayStr = toLocalDateString(today)
  const dateStr = toLocalDateString(date)

  if (dateStr === todayStr) {
    return 'Hoy'
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === toLocalDateString(yesterday)) {
    return 'Ayer'
  }

  const day = date.getDate()
  const month = MONTH_LABELS[date.getMonth()]
  return `${day} ${month}`
}

function toLocalDateString(date: Date): string {
  return date.toLocaleDateString('sv')
}

export function groupByDay(
  messages: MessageItem[],
  now?: Date,
): TimelineItem[] {
  if (messages.length === 0) return []

  const today = now ?? new Date()
  const items: TimelineItem[] = []
  let currentDateStr = ''

  for (const message of messages) {
    const messageDate = new Date(message.created_at)
    const dateStr = toLocalDateString(messageDate)

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr
      items.push({
        kind: 'day-separator',
        label: formatDayLabel(messageDate, today),
        date: dateStr,
      })
    }

    items.push({ kind: 'message', message })
  }

  return items
}
