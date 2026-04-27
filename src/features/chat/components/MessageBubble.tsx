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
  return `${authorDisplayName} a las ${time}: ${preview}`
}

export function MessageBubble({
  direction,
  text,
  authorDisplayName,
  timestamp,
}: MessageBubbleProps) {
  const isOut = direction === 'out'

  return (
    <div
      className={cn(
        'flex px-4 py-0.5',
        isOut ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2',
          isOut
            ? 'rounded-t-2xl rounded-bl-2xl rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-t-2xl rounded-br-2xl rounded-bl-md bg-muted text-foreground',
        )}
        aria-label={buildAriaLabel(authorDisplayName, timestamp, text)}
        role="article"
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {text}
        </p>
        <time
          className={cn(
            'mt-1 block text-right text-[10px]',
            isOut ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
          dateTime={timestamp}
        >
          {formatTime(timestamp)}
        </time>
      </div>
    </div>
  )
}
