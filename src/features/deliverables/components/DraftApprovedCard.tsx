import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import type { DraftTimelineMessage } from '../types'
import type { DraftApprovedSnapshot } from '#/shared/ws/types'

interface DraftApprovedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): DraftApprovedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (typeof snapshot.version !== 'number') return null
  return snapshot as unknown as DraftApprovedSnapshot
}

export function DraftApprovedCard({
  message,
  currentAccountId,
  counterpartDisplayName,
}: DraftApprovedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const isCurrentUser = snapshot.approved_by_account_id === currentAccountId
  const approverName = isCurrentUser ? t`Tú` : counterpartDisplayName || ''

  return (
    <SystemEventCard
      tone="success"
      kicker={t`Draft approved`}
      icon={Check}
      headerVariant="solid"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          {t`Approved by ${approverName} on ${new Date(snapshot.approved_at).toLocaleDateString()}`}
        </p>
      </div>
    </SystemEventCard>
  )
}
