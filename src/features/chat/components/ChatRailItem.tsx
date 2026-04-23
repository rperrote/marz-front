import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { cn } from '#/lib/utils'

interface ChatRailItemProps {
  name: string
  preview: string
  avatarUrl?: string
  avatarFallback?: string
  online?: boolean
  active?: boolean
  unread?: boolean
}

export function ChatRailItem({
  name,
  preview,
  avatarUrl,
  avatarFallback,
  online = false,
  active = false,
  unread = false,
}: ChatRailItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        active ? 'bg-surface-active' : 'hover:bg-surface-hover',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>{avatarFallback ?? initials(name)}</AvatarFallback>
        </Avatar>
        {online ? (
          <span
            aria-hidden
            className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {name}
          </span>
          {unread ? (
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-primary"
            />
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{preview}</p>
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
