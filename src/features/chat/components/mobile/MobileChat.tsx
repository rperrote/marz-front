import { Check, ChevronLeft, Info, Paperclip, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { IconButton } from '#/shared/ui/IconButton'
import { cn } from '#/lib/utils'

// ---- ChatRailItem (mobile: taller, with timestamp + unread badge) ----
interface MobileChatRailItemProps {
  name: string
  preview: string
  timestamp: string
  unreadCount?: number
  avatarUrl?: string
  avatarFallback?: string
}

export function MobileChatRailItem({
  name,
  preview,
  timestamp,
  unreadCount,
  avatarUrl,
  avatarFallback,
}: MobileChatRailItemProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover"
    >
      <Avatar className="size-12 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{avatarFallback ?? initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-base font-semibold text-foreground">
            {name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">{preview}</p>
          {unreadCount && unreadCount > 0 ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ---- ChatHeader (mobile: back + avatar + title/subtitle + info) ----
interface MobileChatHeaderProps {
  name: string
  subtitle?: string
  avatarFallback?: string
  onBack?: () => void
  onInfo?: () => void
}

export function MobileChatHeader({
  name,
  subtitle,
  avatarFallback,
  onBack,
  onInfo,
}: MobileChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-3 py-3">
      <IconButton shape="circle" aria-label="Back" onClick={onBack}>
        <ChevronLeft />
      </IconButton>
      <Avatar className="size-10">
        <AvatarFallback>{avatarFallback ?? initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{name}</div>
        {subtitle ? (
          <div className="truncate text-sm text-muted-foreground">
            {subtitle}
          </div>
        ) : null}
      </div>
      <IconButton
        shape="circle"
        aria-label="Conversation info"
        onClick={onInfo}
      >
        <Info />
      </IconButton>
    </header>
  )
}

// ---- Composer ----
interface MobileComposerProps {
  value: string
  onChange?: (value: string) => void
  onSend?: () => void
  onAttach?: () => void
  placeholder?: string
}

export function MobileComposer({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder = 'Message',
}: MobileComposerProps) {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-background p-3">
      <IconButton shape="circle" aria-label="Attach file" onClick={onAttach}>
        <Paperclip />
      </IconButton>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <IconButton
        variant="solid"
        shape="circle"
        aria-label="Send message"
        onClick={onSend}
      >
        <Send />
      </IconButton>
    </div>
  )
}

// ---- MessageBubble ----
interface MobileMessageBubbleProps {
  direction: 'in' | 'out'
  children: React.ReactNode
}

export function MobileMessageBubble({
  direction,
  children,
}: MobileMessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full',
        direction === 'out' ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          direction === 'in'
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {children}
      </div>
    </div>
  )
}

// ---- EventBubble (mobile: compact pill centered) ----

interface MobileEventBubbleProps {
  icon?: LucideIcon
  children: React.ReactNode
}

export function MobileEventBubble({
  icon: Icon = Check,
  children,
}: MobileEventBubbleProps) {
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {children}
      </span>
    </div>
  )
}
