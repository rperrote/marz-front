import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

export type EventCardTone = 'info' | 'success' | 'warning' | 'destructive' | 'neutral'

/**
 * Header variant: `tint` (muted bg + colored kicker text) vs `solid` (full bg
 * + white kicker). Matches the two patterns seen across system-event cards
 * in the .pen — e.g. DraftSubmittedCard uses tint, OfferAcceptedCard uses
 * solid. Sent/Received variants of the same card often share this.
 */
export type EventCardHeaderVariant = 'tint' | 'solid'

const toneBorder: Record<EventCardTone, string> = {
  info: 'border-info/40',
  success: 'border-success/60',
  warning: 'border-warning/60',
  destructive: 'border-destructive/60',
  neutral: 'border-border',
}

const toneHeaderTint: Record<EventCardTone, string> = {
  info: 'bg-muted text-info',
  success: 'bg-muted text-success',
  warning: 'bg-muted text-warning',
  destructive: 'bg-muted text-destructive',
  neutral: 'bg-muted text-foreground',
}

const toneHeaderSolid: Record<EventCardTone, string> = {
  info: 'bg-info text-info-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-foreground text-background',
}

interface SystemEventCardProps {
  tone: EventCardTone
  kicker: string
  icon: LucideIcon
  headerVariant?: EventCardHeaderVariant
  children: ReactNode
  className?: string
}

export function SystemEventCard({
  tone,
  kicker,
  icon: Icon,
  headerVariant = 'tint',
  children,
  className,
}: SystemEventCardProps) {
  const header =
    headerVariant === 'solid' ? toneHeaderSolid[tone] : toneHeaderTint[tone]
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 bg-card',
        toneBorder[tone],
        className,
      )}
    >
      <div className={cn('flex items-center gap-2 px-4 py-2.5', header)}>
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">
          {kicker}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/** Key-value tile used inside cards (BUDGET, DEADLINE, etc). */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-muted px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold text-foreground">{value}</div>
    </div>
  )
}

interface VideoPlaceholderProps {
  duration: string
  /** Aspect ratio class — `16/9` default, `9/16` for vertical reels. */
  aspect?: 'landscape' | 'portrait'
}

export function VideoPlaceholder({
  duration,
  aspect = 'landscape',
}: VideoPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-muted',
        aspect === 'landscape' ? 'aspect-video' : 'aspect-[9/16]',
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-foreground/70 text-background">
          <PlayGlyph />
        </div>
      </div>
      <span className="absolute bottom-2.5 right-2.5 rounded-md bg-foreground px-2 py-0.5 font-mono text-xs text-background">
        {duration}
      </span>
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M7 4.5v13l11-6.5L7 4.5z" fill="currentColor" />
    </svg>
  )
}
