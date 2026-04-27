import { useEffect, useMemo, useRef } from 'react'
import { Upload, Film, Timer } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { InlineVideoPlayer } from './InlineVideoPlayer'
import { ApproveDraftButton } from './ApproveDraftButton'
import { trackDraftSubmittedCardSeen } from '#/features/deliverables/analytics'
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

  const cardRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef(false)

  useEffect(() => {
    if (!cardRef.current || !snapshot) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true
            trackDraftSubmittedCardSeen({
              message_id: message.id,
              deliverable_id: snapshot.deliverable_id,
              version: snapshot.version,
            })
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [message.id, snapshot])

  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)

  if (!snapshot) return null

  const isBrand = sessionKind === 'brand'

  const currentVersion =
    deliverablesQuery.data?.deliverables.find(
      (d) => d.id === snapshot.deliverable_id,
    )?.current_version ?? null

  const isCurrentUser = snapshot.submitted_by_account_id === currentAccountId
  const submitterName = isCurrentUser ? t`Tú` : counterpartDisplayName || ''

  const durationLabel =
    snapshot.duration_sec != null
      ? formatDurationHHMMSS(snapshot.duration_sec)
      : '--:--'

  return (
    <div ref={cardRef}>
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
              deliverableId={snapshot.deliverable_id}
              draftId={snapshot.draft_id}
            />
          )}

          {isBrand && (
            <ApproveDraftButton
              deliverableId={snapshot.deliverable_id}
              conversationId={conversationId}
              version={snapshot.version}
              currentVersion={currentVersion}
              draftId={snapshot.draft_id}
            />
          )}
        </div>
      </SystemEventCard>
    </div>
  )
}
