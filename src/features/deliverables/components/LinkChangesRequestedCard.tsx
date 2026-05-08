import { RequestChangesCard } from './RequestChangesCard'
import type { DraftTimelineMessage } from '../types'

interface LinkChangesRequestedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
  sessionKind?: 'brand' | 'creator'
}

export function LinkChangesRequestedCard({
  message,
  currentAccountId,
  counterpartDisplayName,
  sessionKind,
}: LinkChangesRequestedCardProps) {
  return (
    <RequestChangesCard
      message={message}
      currentAccountId={currentAccountId}
      counterpartDisplayName={counterpartDisplayName}
      sessionKind={sessionKind}
      target="link"
    />
  )
}
