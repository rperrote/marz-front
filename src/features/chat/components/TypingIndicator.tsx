import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { useTypingActors } from '#/features/chat/stores/typingStore'

const TYPING_DOT_DELAYS = [0, 150, 300] as const

interface TypingIndicatorProps {
  conversationId: string
  currentAccountId: string
}

export function TypingIndicator({
  conversationId,
  currentAccountId,
}: TypingIndicatorProps) {
  const actors = useTypingActors(conversationId)
  const othersCount = actors.has(currentAccountId)
    ? actors.size - 1
    : actors.size
  const othersTyping = othersCount > 0

  if (!othersTyping) return null

  return (
    <div
      className="flex items-center gap-2 px-5 py-1.5"
      role="status"
      aria-label={t`Escribiendo...`}
    >
      <div className="flex gap-0.5">
        {TYPING_DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className={cn(
              'size-1.5 rounded-full bg-muted-foreground',
              'animate-bounce',
            )}
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t`Escribiendo...`}</span>
    </div>
  )
}
