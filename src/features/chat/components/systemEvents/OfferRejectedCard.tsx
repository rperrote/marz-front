import { t } from '@lingui/core/macro'
import { XCircle } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferRejectedCardProps {
  message: MessageItem
}

export function OfferRejectedCard({ message }: OfferRejectedCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta rechazada`}>
      <EventBubble severity="destructive" direction="in" icon={XCircle}>
        {t`Oferta rechazada`}
      </EventBubble>
    </article>
  )
}
