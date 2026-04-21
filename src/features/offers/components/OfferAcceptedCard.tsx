import { Check, Upload } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

interface OfferAcceptedCardBaseProps {
  deadline: string
}

interface OfferAcceptedCardCreatorProps extends OfferAcceptedCardBaseProps {
  audience: 'creator'
  onUploadDraft?: () => void
}

interface OfferAcceptedCardBrandProps extends OfferAcceptedCardBaseProps {
  audience: 'brand'
  creatorName: string
}

type OfferAcceptedCardProps =
  | OfferAcceptedCardCreatorProps
  | OfferAcceptedCardBrandProps

export function OfferAcceptedCard(props: OfferAcceptedCardProps) {
  return (
    <SystemEventCard
      tone="success"
      kicker="Offer accepted"
      icon={Check}
      headerVariant="solid"
    >
      {props.audience === 'creator' ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              You accepted the offer
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start preparing your draft. Deadline is {props.deadline}.
            </p>
          </div>
          <Button
            className="w-full bg-info text-info-foreground hover:bg-info/90"
            onClick={props.onUploadDraft}
          >
            <Upload />
            Upload draft
          </Button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {props.creatorName} accepted the offer
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {props.creatorName.split(' ')[0]} is preparing the draft. Deadline is {props.deadline}.
          </p>
        </div>
      )}
    </SystemEventCard>
  )
}
