import { t } from '@lingui/core/macro'

import { EventBubble } from '#/shared/ui/EventBubble'
import type { ViewerSide } from '../types'

interface OfferRejectedBubbleProps {
  viewerSide: ViewerSide
}

export function OfferRejectedBubble({ viewerSide }: OfferRejectedBubbleProps) {
  const direction = viewerSide === 'actor' ? 'out' : 'in'

  return (
    <div role="status" aria-label={t`Offer rejected`}>
      <EventBubble severity="destructive" direction={direction}>
        {t`Offer rejected`}
      </EventBubble>
    </div>
  )
}
