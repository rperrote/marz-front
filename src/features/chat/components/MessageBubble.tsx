import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'

export type BubbleDirection = 'in' | 'out'

interface MessageBubbleProps {
  direction: BubbleDirection
  text: string
  authorDisplayName: string
  timestamp: string
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function buildAriaLabel(
  authorDisplayName: string,
  timestamp: string,
  text: string,
): string {
  const time = formatTime(timestamp)
  const preview = text.length > 80 ? text.slice(0, 80) + '…' : text
  return t`${authorDisplayName} a las ${time}: ${preview}`
}

function BubbleTail({ direction }: { direction: BubbleDirection }) {
  const isOut = direction === 'out'
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 13"
      width="8"
      height="13"
      className={cn(
        'absolute bottom-0',
        isOut
          ? '-right-[7px] text-primary'
          : '-left-[7px] -scale-x-100 text-muted',
      )}
    >
      <path
        fill="currentColor"
        d="M0 0v13h8c-4-1-7-5-7-9C1 2 .5 1 0 0z"
      />
    </svg>
  )
}

export function MessageBubble({
  direction,
  text,
  authorDisplayName,
  timestamp,
}: MessageBubbleProps) {
  const isOut = direction === 'out'

  return (
    <div className={cn('flex py-0.5', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-2.5 py-1',
          isOut
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-muted text-foreground',
        )}
        aria-label={buildAriaLabel(authorDisplayName, timestamp, text)}
        role="article"
      >
        <div className="flex items-end gap-2 font-sans">
          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-snug">
            {text}
          </p>
          <time
            className={cn(
              'shrink-0 translate-y-0.5 text-[10px] leading-none',
              isOut ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
            dateTime={timestamp}
          >
            {formatTime(timestamp)}
          </time>
        </div>
        <BubbleTail direction={direction} />
      </div>
    </div>
  )
}
