import { useRef } from 'react'
import { t } from '@lingui/core/macro'

import { EventBubble } from '#/shared/ui/EventBubble'
import { useViewedOnce } from '#/shared/hooks/useViewedOnce'
import type { ViewerSide } from '../types'
import { trackOfferEvent, markOfferSeen } from '../analytics'
import type { ActorKind } from '../analytics'

interface OfferExpiredBubbleProps {
  viewerSide: ViewerSide
  offerId?: string
  sentAt?: string
  actorKind: ActorKind
}

export function OfferExpiredBubble({
  viewerSide,
  offerId,
  sentAt,
  actorKind,
}: OfferExpiredBubbleProps) {
  const direction = viewerSide === 'actor' ? 'out' : 'in'
  const bubbleRef = useRef<HTMLDivElement>(null)

  useViewedOnce(bubbleRef, () => {
    if (!offerId || !sentAt) return
    if (!markOfferSeen(offerId, 'offer_expired_seen')) return
    const offerAgeDays = Math.floor(
      (Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    trackOfferEvent('offer_expired_seen', {
      actor_kind: actorKind,
      offer_age_days_at_seen: offerAgeDays,
    })
  })

  return (
    <div ref={bubbleRef} role="status" aria-label={t`Offer expired`}>
      <EventBubble severity="warning" direction={direction}>
        {t`Offer expired`}
      </EventBubble>
    </div>
  )
}
