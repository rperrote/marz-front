import { t } from '@lingui/core/macro'
import { Send } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferSentCardProps {
  message: MessageItem
}

export function OfferSentCard({ message }: OfferSentCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta enviada`}>
      <EventBubble severity="info" direction="out" icon={Send}>
        {t`Oferta enviada`}
      </EventBubble>
    </article>
  )
}
