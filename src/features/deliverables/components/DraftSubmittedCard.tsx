import { useMemo } from 'react'
import { Upload, Film, Timer } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { InlineVideoPlayer } from './InlineVideoPlayer'
import { ApproveDraftButton } from './ApproveDraftButton'
import type { DraftTimelineMessage } from '../types'
import type { DraftSubmittedSnapshot } from '#/shared/ws/types'

interface DraftSubmittedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
  conversationId: string
  sessionKind: 'brand' | 'creator' | undefined
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): DraftSubmittedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (typeof snapshot.version !== 'number') return null
  return snapshot as unknown as DraftSubmittedSnapshot
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDurationHHMMSS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function deriveAspect(format: string | undefined): 'landscape' | 'portrait' {
  return format === 'reel' || format === 'short' ? 'portrait' : 'landscape'
}

export function DraftSubmittedCard({
  message,
  currentAccountId,
  counterpartDisplayName,
  conversationId,
  sessionKind,
}: DraftSubmittedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const isBrand = sessionKind === 'brand'

  const isCurrentUser = snapshot.submitted_by_account_id === currentAccountId
  const submitterName = isCurrentUser ? t`Tú` : counterpartDisplayName || ''

  const durationLabel =
    snapshot.duration_sec != null
      ? formatDurationHHMMSS(snapshot.duration_sec)
      : '--:--'

  return (
    <SystemEventCard
      tone="info"
      kicker={t`Draft submitted`}
      icon={Upload}
      headerVariant="solid"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{submitterName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Film className="size-4" />
              {snapshot.original_filename}
            </span>
            <span className="font-mono">
              {formatFileSize(snapshot.file_size_bytes)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-4" />
            <span className="font-mono">{durationLabel}</span>
            <span className="text-muted-foreground">
              · {t`v${snapshot.version}`}
            </span>
          </div>
        </div>

        {isBrand && (
          <InlineVideoPlayer
            playbackUrl={snapshot.playback_url}
            thumbnailUrl={snapshot.thumbnail_url ?? undefined}
            durationSec={snapshot.duration_sec ?? undefined}
            aspect={deriveAspect(snapshot.deliverable_format)}
          />
        )}

        {isBrand && (
          <ApproveDraftButton
            deliverableId={snapshot.deliverable_id}
            conversationId={conversationId}
            version={snapshot.version}
          />
        )}
      </div>
    </SystemEventCard>
  )
}
