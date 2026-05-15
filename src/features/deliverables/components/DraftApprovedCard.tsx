import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { useClientNow } from '#/shared/hooks'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import type { DraftTimelineMessage } from '../types'
import type { DraftApprovedSnapshot } from '#/shared/ws/types'

interface DraftApprovedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
  sessionKind?: 'brand' | 'creator'
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
  sessionKind,
}: DraftApprovedCardProps) {
  const clientNow = useClientNow()
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const isCurrentUser = snapshot.approved_by_account_id === currentAccountId
  const approverName = isCurrentUser ? t`Tú` : counterpartDisplayName || ''
  const approvedDate =
    clientNow === null
      ? null
      : new Date(snapshot.approved_at).toLocaleDateString()

  return (
    <SystemEventCard
      tone="success"
      kicker={t`Draft aprobado`}
      icon={Check}
      headerVariant="solid"
      side={sessionKind === 'brand' ? 'out' : 'in'}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          {approvedDate === null
            ? t`Aprobado por ${approverName}`
            : t`Aprobado por ${approverName} el ${approvedDate}`}
        </p>
      </div>
    </SystemEventCard>
  )
}
