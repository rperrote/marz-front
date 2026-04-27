import { Check } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import type { OfferAcceptedSnap } from '../types'
import { formatOfferDeadline } from '../utils/formatOffer'

interface OfferAcceptedCardOutProps {
  snapshot: OfferAcceptedSnap
  creatorName: string
}

export function OfferAcceptedCardOut({
  snapshot,
  creatorName,
}: OfferAcceptedCardOutProps) {
  const deadline = formatOfferDeadline(snapshot.deadline)
  const firstName = creatorName.split(' ')[0] ?? creatorName

  return (
    <div
      role="article"
      aria-label={t`${creatorName} accepted the offer, deadline ${deadline}`}
    >
      <SystemEventCard
        tone="success"
        kicker={t`Offer accepted`}
        icon={Check}
        headerVariant="solid"
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t`${creatorName} accepted the offer`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t`${firstName} is preparing the draft. Deadline is ${deadline}.`}
          </p>
        </div>
      </SystemEventCard>
    </div>
  )
}
