import { t } from '@lingui/core/macro'
import { Ban } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import type { OfferCancelledPhase } from './offerEventCardUtils'
import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferCancelledCardProps {
  message: MessageItem
  phase?: OfferCancelledPhase
}

export function OfferCancelledCard({
  message,
  phase,
}: OfferCancelledCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  const resolvedPhase = phase ?? snapshot.phase ?? 'pre_accept'
  const copy =
    resolvedPhase === 'post_accept'
      ? t`Oferta cancelada tras aceptación`
      : t`Oferta cancelada`

  return (
    <article role="article" aria-label={t`Oferta cancelada`}>
      <EventBubble severity="destructive" direction="out" icon={Ban}>
        {copy}
      </EventBubble>
    </article>
  )
}
