import { Check, Hourglass, Upload, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'

export type EventSeverity = 'info' | 'success' | 'warning' | 'destructive'
export type EventDirection = 'in' | 'out'

interface EventBubbleProps {
  severity: EventSeverity
  direction: EventDirection
  icon?: LucideIcon
  children: React.ReactNode
}

const defaultIcon: Record<EventSeverity, LucideIcon> = {
  info: Upload,
  success: Check,
  warning: Hourglass,
  destructive: X,
}

const styles: Record<EventSeverity, { out: string; in: string }> = {
  info: {
    out: 'bg-info/10 text-info',
    in: 'bg-info text-info-foreground',
  },
  success: {
    out: 'bg-success/10 text-success',
    in: 'bg-success text-success-foreground',
  },
  warning: {
    out: 'bg-warning/15 text-warning',
    in: 'bg-warning text-warning-foreground',
  },
  destructive: {
    out: 'bg-destructive/10 text-destructive',
    in: 'bg-destructive text-destructive-foreground',
  },
}

export function EventBubble({
  severity,
  direction,
  icon,
  children,
}: EventBubbleProps) {
  const Icon = icon ?? defaultIcon[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
        styles[severity][direction],
      )}
    >
      <Icon className="size-4" />
      {children}
    </span>
  )
}
