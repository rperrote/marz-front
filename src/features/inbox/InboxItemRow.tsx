import { t } from '@lingui/core/macro'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { ApiError } from '#/shared/api/mutator'

import type { InboxItem } from './api/inbox'
import { useMarkInboxItemReadMutation } from './hooks/useMarkInboxItemReadMutation'

interface InboxItemRowProps {
  item: InboxItem
}

export function InboxItemRow({ item }: InboxItemRowProps) {
  const counterpartName = item.counterpart?.display_name ?? item.meta.primary
  const avatarUrl = item.counterpart?.avatar_url
  const isWaiting = item.section === 'waiting'
  const markRead = useMarkInboxItemReadMutation()

  function handleMarkRead() {
    markRead.mutate(
      { item_id: item.id, read_reason: 'manual' },
      {
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'inbox_item_not_actionable'
          ) {
            toast.info(t`Este item ya no requiere acción.`)
            return
          }

          toast.error(t`No se pudo marcar como leído. Intentá de nuevo.`)
        },
      },
    )
  }

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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleMarkRead}
          disabled={markRead.isPending}
          aria-label={t`Marcar item como leído`}
          className="shrink-0 rounded-full"
        >
          {markRead.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          <span className="hidden sm:inline">{t`Mark read`}</span>
        </Button>
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
