import { Check } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { formatOfferDeadline } from '../utils/formatOffer'

interface OfferAcceptedCardOutProps {
  snapshot: { campaign_name: string; deadline: string }
  creatorName: string
  side?: 'in' | 'out'
}

export function OfferAcceptedCardOut({
  snapshot,
  creatorName,
  side,
}: OfferAcceptedCardOutProps) {
  const deadline = formatOfferDeadline(snapshot.deadline)
  const firstName = creatorName.split(' ')[0] ?? creatorName

  return (
    <div
      role="article"
      aria-label={t`${creatorName} aceptó la oferta, deadline ${deadline}`}
    >
      <SystemEventCard
        tone="success"
        kicker={t`Oferta aceptada`}
        icon={Check}
        headerVariant="solid"
        side={side}
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t`${creatorName} aceptó la oferta`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t`${firstName} está preparando el draft. Deadline ${deadline}.`}
          </p>
        </div>
      </SystemEventCard>
    </div>
  )
}
