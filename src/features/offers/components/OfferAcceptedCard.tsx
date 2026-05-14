import { Check, Upload } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'

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
  const deadline = props.deadline
  return (
    <SystemEventCard
      tone="success"
      kicker={t`Offer accepted`}
      icon={Check}
      headerVariant="solid"
    >
      {props.audience === 'creator' ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              <Trans>You accepted the offer</Trans>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans>Start preparing your draft. Deadline is {deadline}.</Trans>
            </p>
          </div>
          <Button
            className="w-full bg-info text-info-foreground hover:bg-info/90"
            onClick={props.onUploadDraft}
          >
            <Upload />
            <Trans>Upload draft</Trans>
          </Button>
        </div>
      ) : (
        <div>
          {(() => {
            const creatorName = props.creatorName
            const firstName = props.creatorName.split(' ')[0]
            const offerDeadline = props.deadline
            return (
              <>
                <h3 className="text-lg font-semibold text-foreground">
                  <Trans>{creatorName} accepted the offer</Trans>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Trans>
                    {firstName} is preparing the draft. Deadline is{' '}
                    {offerDeadline}.
                  </Trans>
                </p>
              </>
            )
          })()}
        </div>
      )}
    </SystemEventCard>
  )
}
