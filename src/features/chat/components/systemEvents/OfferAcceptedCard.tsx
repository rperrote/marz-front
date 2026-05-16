import { t } from '@lingui/core/macro'
import { CheckCircle2 } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferAcceptedCardProps {
  message: MessageItem
}

export function OfferAcceptedCard({ message }: OfferAcceptedCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta aceptada`}>
      <EventBubble severity="success" direction="in" icon={CheckCircle2}>
        {t`Oferta aceptada`}
      </EventBubble>
    </article>
  )
}
