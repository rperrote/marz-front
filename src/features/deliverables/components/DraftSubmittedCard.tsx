import { Film, Timer, Upload } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { SystemEventCard, VideoPlaceholder } from '#/shared/ui/SystemEventCard'

interface DraftSubmittedCardBaseProps {
  message: string
  filename: string
  sizeLabel: string
  duration: string
  /** `portrait` when the deliverable format is a reel/short. */
  aspect?: 'landscape' | 'portrait'
}

interface DraftSubmittedCardCreatorProps extends DraftSubmittedCardBaseProps {
  audience: 'creator'
  statusLabel?: string
}

interface DraftSubmittedCardBrandProps extends DraftSubmittedCardBaseProps {
  audience: 'brand'
  onApprove?: () => void
  onRequestChanges?: () => void
}

type DraftSubmittedCardProps =
  | DraftSubmittedCardCreatorProps
  | DraftSubmittedCardBrandProps

export function DraftSubmittedCard(props: DraftSubmittedCardProps) {
  return (
    <SystemEventCard
      tone="info"
      kicker="Draft submitted"
      icon={Upload}
      headerVariant="solid"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">{props.message}</p>

        <VideoPlaceholder duration={props.duration} aspect={props.aspect} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Film className="size-4" />
            {props.filename}
          </span>
          <span className="font-mono">{props.sizeLabel}</span>
        </div>

        {props.audience === 'creator' ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Timer className="size-4" />
            {props.statusLabel ?? 'Awaiting review'}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={props.onApprove}>
              Approve draft
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={props.onRequestChanges}
            >
              Request changes
            </Button>
          </div>
        )}
      </div>
    </SystemEventCard>
  )
}
