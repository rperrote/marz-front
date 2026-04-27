import { useState, useCallback } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'

interface InlineVideoPlayerProps {
  playbackUrl: string
  thumbnailUrl?: string
  durationSec?: number
  onPlay?: () => void
  onPause?: () => void
}

export function InlineVideoPlayer({
  playbackUrl,
  thumbnailUrl,
  durationSec,
  onPlay,
  onPause,
}: InlineVideoPlayerProps) {
  const [hasError, setHasError] = useState(false)

  const handlePlay = useCallback(() => {
    onPlay?.()
  }, [onPlay])

  const handlePause = useCallback(() => {
    onPause?.()
  }, [onPause])

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-muted',
        'aspect-video',
      )}
    >
      {hasError ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t`Cannot play this video`}
          </p>
        </div>
      ) : (
        <video
          controls
          playsInline
          preload="metadata"
          src={playbackUrl}
          poster={thumbnailUrl}
          className="h-full w-full"
          onError={() => setHasError(true)}
          onPlay={handlePlay}
          onPause={handlePause}
        />
      )}
      {durationSec !== undefined && durationSec > 0 && !hasError && (
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-foreground px-2 py-0.5 font-mono text-xs text-background">
          {formatDuration(durationSec)}
        </span>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
