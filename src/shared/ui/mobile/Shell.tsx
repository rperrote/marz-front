import type { ReactNode } from 'react'
import { ChevronLeft, MoreHorizontal } from 'lucide-react'

import { IconButton } from '#/shared/ui/IconButton'
import { cn } from '#/lib/utils'

/**
 * Mobile shell primitives. These are generic enough to live in shared/ui.
 * Product-specific mobile organisms (chat, offers) sit in their features.
 */

export function MobileStatusBar({ time = '9:41' }: { time?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-sm font-semibold">
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </div>
    </div>
  )
}

function SignalGlyph() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
      <rect x="0" y="7" width="3" height="3" rx="0.5" fill="currentColor" />
      <rect x="4" y="5" width="3" height="5" rx="0.5" fill="currentColor" />
      <rect x="8" y="3" width="3" height="7" rx="0.5" fill="currentColor" />
      <rect x="12" y="0" width="3" height="10" rx="0.5" fill="currentColor" />
    </svg>
  )
}
function WifiGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
      <path d="M7 10 L9.5 7.5 A3.5 3.5 0 0 0 4.5 7.5 Z" fill="currentColor" />
      <path d="M1 4 A8 8 0 0 1 13 4 l-1.5 1.5 A6 6 0 0 0 2.5 5.5 Z" fill="currentColor" />
    </svg>
  )
}
function BatteryGlyph() {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden>
      <rect x="0.5" y="0.5" width="19" height="9" rx="2" fill="none" stroke="currentColor" />
      <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor" />
      <rect x="20" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" />
    </svg>
  )
}

export function MobileHomeIndicator() {
  return (
    <div className="flex h-6 items-center justify-center">
      <span className="h-1 w-32 rounded-full bg-foreground" />
    </div>
  )
}

interface MobileTopbarProps {
  title: string
  onBack?: () => void
  right?: ReactNode
}

export function MobileTopbar({ title, onBack, right }: MobileTopbarProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
      <IconButton
        shape="circle"
        aria-label="Back"
        onClick={onBack}
        className="shrink-0"
      >
        <ChevronLeft />
      </IconButton>
      <h1 className="flex-1 text-center text-base font-semibold text-foreground">
        {title}
      </h1>
      <div className="flex shrink-0 items-center">
        {right ?? (
          <IconButton aria-label="More actions">
            <MoreHorizontal />
          </IconButton>
        )}
      </div>
    </header>
  )
}

export interface MobileTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface MobileBottomTabBarProps {
  tabs: Array<MobileTab>
  activeId: string
  onSelect?: (id: string) => void
}

export function MobileBottomTabBar({
  tabs,
  activeId,
  onSelect,
}: MobileBottomTabBarProps) {
  return (
    <nav className="flex items-center justify-around border-t border-border bg-card px-2 py-3">
      {tabs.map((tab) => {
        const active = tab.id === activeId
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect?.(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 text-[11px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('size-6', active ? 'text-primary' : 'text-muted-foreground')} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

interface MobileFloatingActionProps {
  label: string
  icon?: ReactNode
  onClick?: () => void
}

export function MobileFloatingAction({
  label,
  icon,
  onClick,
}: MobileFloatingActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary-hover"
    >
      {icon}
      {label}
    </button>
  )
}

interface MobileActionBarProps {
  children: ReactNode
}

export function MobileActionBar({ children }: MobileActionBarProps) {
  return (
    <div className="rounded-full border-2 border-primary bg-muted px-4 py-3">
      <div className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary">
        {children}
      </div>
    </div>
  )
}
