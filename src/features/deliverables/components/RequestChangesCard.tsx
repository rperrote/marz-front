import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { formatMessageDateTime } from '#/shared/ui/formatMessageDateTime'
import { ChangeCategoryChip } from './ChangeCategoryChip'
import type { DraftTimelineMessage } from '../types'
import type { ChangesRequestedSnapshot } from '#/shared/ws/types'

interface RequestChangesCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
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
}: RequestChangesCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const isOutgoing = snapshot.requested_by_account_id === currentAccountId
  const requesterName = isOutgoing ? t`Tú` : counterpartDisplayName

  const notes = snapshot.notes?.trim() ?? ''

  return (
    <div
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
