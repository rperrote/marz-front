import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { useTypingActors } from '#/features/chat/stores/typingStore'

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
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'size-1.5 rounded-full bg-muted-foreground',
              'animate-bounce',
            )}
            style={{ animationDelay: `${i * 150}ms` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t`Escribiendo...`}</span>
    </div>
  )
}
