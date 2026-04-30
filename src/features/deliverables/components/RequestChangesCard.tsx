import { useEffect, useMemo, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { formatMessageDateTime } from '#/shared/ui/formatMessageDateTime'
import { ChangeCategoryChip } from './ChangeCategoryChip'
import { trackRequestChangesCardSeen } from '#/features/deliverables/analytics'
import type { DraftTimelineMessage } from '../types'
import type { ChangesRequestedSnapshot } from '#/shared/ws/types'

interface RequestChangesCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
  sessionKind?: 'brand' | 'creator'
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): ChangesRequestedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (typeof snapshot.draft_version !== 'number') return null
  if (!Array.isArray(snapshot.categories)) return null
  return snapshot as unknown as ChangesRequestedSnapshot
}

const CATEGORY_LABELS: Record<string, () => string> = {
  product_placement: () => t`Product placement`,
  pacing: () => t`Pacing`,
  audio: () => t`Audio`,
  discount_code: () => t`Discount code`,
  other: () => t`Other`,
}

export function RequestChangesCard({
  message,
  currentAccountId,
  counterpartDisplayName,
  sessionKind,
}: RequestChangesCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef(false)

  useEffect(() => {
    if (!snapshot || sessionKind !== 'creator' || !cardRef.current) return

    let timeoutId: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
        )
        if (!isVisible) {
          if (timeoutId != null) {
            window.clearTimeout(timeoutId)
            timeoutId = null
          }
          return
        }
        if (seenRef.current || timeoutId != null) return

        timeoutId = window.setTimeout(() => {
          seenRef.current = true
          trackRequestChangesCardSeen({
            actor_kind: 'creator',
            time_since_request_seconds: Math.max(
              0,
              (Date.now() - Date.parse(snapshot.requested_at)) / 1000,
            ),
          })
          observer.disconnect()
        }, 250)
      },
      { threshold: 0.5 },
    )

    observer.observe(cardRef.current)

    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [sessionKind, snapshot])

  if (!snapshot) return null

  const isOutgoing = snapshot.requested_by_account_id === currentAccountId
  const requesterName = isOutgoing ? t`Tú` : counterpartDisplayName

  const notes = snapshot.notes?.trim() ?? ''

  return (
    <div
      ref={cardRef}
      data-testid="request-changes-card"
      className={cn(
        'flex px-4 py-0.5',
        isOutgoing ? 'justify-end' : 'justify-start',
      )}
    >
      <div className="max-w-[75%]">
        <SystemEventCard
          tone="warning"
          kicker={t`Changes requested`}
          icon={AlertCircle}
          headerVariant="solid"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">
                {requesterName}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {formatMessageDateTime(message.created_at)}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              {t`v${snapshot.draft_version}`}
            </div>

            {snapshot.draft_thumbnail_url ? (
              <div className="relative w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={snapshot.draft_thumbnail_url}
                  alt={t`Draft thumbnail`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            {snapshot.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {snapshot.categories.map((category) => (
                  <ChangeCategoryChip
                    key={category}
                    label={CATEGORY_LABELS[category]?.() ?? category}
                    selected
                    readOnly
                  />
                ))}
              </div>
            ) : null}

            <div className="text-sm text-foreground">
              {notes ? (
                <p className="whitespace-pre-wrap">{notes}</p>
              ) : (
                <p className="italic text-muted-foreground">
                  {t`No additional notes`}
                </p>
              )}
            </div>
          </div>
        </SystemEventCard>
      </div>
    </div>
  )
}
