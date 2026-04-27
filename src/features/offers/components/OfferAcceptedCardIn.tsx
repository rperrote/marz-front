import { Check, Upload } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import type { OfferAcceptedSnap } from '../types'
import { formatOfferDeadline } from '../utils/formatOffer'

interface OfferAcceptedCardInProps {
  snapshot: OfferAcceptedSnap
  onUploadDraft?: () => void
}

export function OfferAcceptedCardIn({
  snapshot,
  onUploadDraft,
}: OfferAcceptedCardInProps) {
  const deadline = formatOfferDeadline(snapshot.deadline)

  return (
    <div
      role="article"
      aria-label={t`You accepted the offer, deadline ${deadline}`}
    >
      <SystemEventCard
        tone="success"
        kicker={t`Offer accepted`}
        icon={Check}
        headerVariant="solid"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t`You accepted the offer`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t`Start preparing your draft. Deadline is ${deadline}.`}
            </p>
          </div>
          <Button
            className="w-full bg-info text-info-foreground hover:bg-info/90"
            onClick={onUploadDraft}
          >
            <Upload />
            {t`Upload draft`}
          </Button>
        </div>
      </SystemEventCard>
    </div>
  )
}
