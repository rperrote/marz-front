import { t } from '@lingui/core/macro'

import { EventBubble } from '#/shared/ui/EventBubble'
import type { ViewerSide } from '../types'

interface OfferExpiredBubbleProps {
  viewerSide: ViewerSide
}

export function OfferExpiredBubble({ viewerSide }: OfferExpiredBubbleProps) {
  const direction = viewerSide === 'actor' ? 'out' : 'in'

  return (
    <div role="status" aria-label={t`Offer expired`}>
      <EventBubble severity="warning" direction={direction}>
        {t`Offer expired`}
      </EventBubble>
    </div>
  )
}
