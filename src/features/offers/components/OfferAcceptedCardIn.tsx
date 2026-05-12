import { Check, Upload } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { formatOfferDeadline } from '../utils/formatOffer'

interface OfferAcceptedCardInProps {
  snapshot: { deadline: string }
  side?: 'in' | 'out'
  onUploadDraft?: () => void
}

export function OfferAcceptedCardIn({
  snapshot,
  side,
  onUploadDraft,
}: OfferAcceptedCardInProps) {
  const deadline = formatOfferDeadline(snapshot.deadline)

  return (
    <div
      role="article"
      aria-label={t`Aceptaste la oferta, deadline ${deadline}`}
    >
      <SystemEventCard
        tone="success"
        kicker={t`Oferta aceptada`}
        icon={Check}
        headerVariant="solid"
        side={side}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t`Aceptaste la oferta`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t`Empezá a preparar el draft. Deadline ${deadline}.`}
            </p>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onUploadDraft}
          >
            <Upload />
            {t`Subir draft`}
          </Button>
        </div>
      </SystemEventCard>
    </div>
  )
}
