import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { cn } from '#/lib/utils'

import type { InboxItem } from './api/inbox'

interface InboxItemRowProps {
  item: InboxItem
}

export function InboxItemRow({ item }: InboxItemRowProps) {
  const counterpartName = item.counterpart?.display_name ?? item.meta.primary
  const avatarUrl = item.counterpart?.avatar_url
  const isWaiting = item.section === 'waiting'

  return (
    <li>
      <article
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3',
          isWaiting && 'opacity-90',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-11 w-1 shrink-0 rounded-full',
            isWaiting ? 'bg-border-strong' : 'bg-primary',
          )}
        />

        <Avatar size="lg">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={counterpartName} />
          ) : null}
          <AvatarFallback>{getInitials(counterpartName)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="truncate font-semibold text-foreground">
              {item.meta.primary}
            </span>
            <span className="text-muted-foreground" aria-hidden>
              -
            </span>
            <span className="truncate text-muted-foreground">
              {item.meta.secondary}
            </span>
            <span className="shrink-0 text-muted-foreground" aria-hidden>
              -
            </span>
            <time
              className="shrink-0 text-muted-foreground"
              dateTime={item.occurred_at}
            >
              {item.meta.timestamp}
            </time>
          </div>

          <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.preview}
          </p>
        </div>

        <div className="hidden min-w-28 shrink-0 sm:block" aria-hidden />
      </article>
    </li>
  )
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || '?'
}
