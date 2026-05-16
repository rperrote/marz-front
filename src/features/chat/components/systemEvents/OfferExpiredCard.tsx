import { t } from '@lingui/core/macro'
import { Clock3 } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferExpiredCardProps {
  message: MessageItem
}

export function OfferExpiredCard({ message }: OfferExpiredCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta vencida`}>
      <EventBubble severity="warning" direction="in" icon={Clock3}>
        {t`Oferta vencida`}
      </EventBubble>
    </article>
  )
}
