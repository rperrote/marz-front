import { ChevronDown } from 'lucide-react'

import type { ConversationDetailCounterpart } from '#/features/chat/types'

interface ConversationContextHeaderProps {
  counterpart: ConversationDetailCounterpart
  sessionKind: 'brand' | 'creator'
}

export function ConversationContextHeader({
  counterpart,
  sessionKind,
}: ConversationContextHeaderProps) {
  const fallback = counterpart.display_name.charAt(0).toUpperCase()

  if (sessionKind === 'creator') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CounterpartAvatar
          src={counterpart.avatar_url}
          name={counterpart.display_name}
          fallback={fallback}
          size="lg"
        />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {counterpart.display_name}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <CounterpartAvatar
        src={counterpart.avatar_url}
        name={counterpart.display_name}
        fallback={fallback}
        size="md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">
          {counterpart.display_name}
        </span>
        {counterpart.handle ? (
          <span className="truncate text-xs text-muted-foreground">
            @{counterpart.handle}
          </span>
        ) : null}
      </div>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </div>
  )
}

interface CounterpartAvatarProps {
  src?: string | null
  name: string
  fallback: string
  size: 'md' | 'lg'
}

function CounterpartAvatar({
  src,
  name,
  fallback,
  size,
}: CounterpartAvatarProps) {
  /* eslint-disable-next-line lingui/no-unlocalized-strings -- Tailwind size classes are not translatable UI copy. */
  const sizeClass = size === 'lg' ? 'size-14 text-xl' : 'size-10 text-sm'

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary font-semibold text-primary-foreground`}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
