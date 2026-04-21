import { Check, Film } from 'lucide-react'

import {
  SystemEventCard,
  VideoPlaceholder,
} from '#/shared/ui/SystemEventCard'

interface DraftApprovedCardProps {
  message: string
  filename: string
  sizeLabel: string
  duration: string
  aspect?: 'landscape' | 'portrait'
}

export function DraftApprovedCard({
  message,
  filename,
  sizeLabel,
  duration,
  aspect,
}: DraftApprovedCardProps) {
  return (
    <SystemEventCard
      tone="success"
      kicker="Draft approved"
      icon={Check}
      headerVariant="solid"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">{message}</p>

        <VideoPlaceholder duration={duration} aspect={aspect} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Film className="size-4" />
            {filename}
          </span>
          <span className="font-mono">{sizeLabel}</span>
        </div>
      </div>
    </SystemEventCard>
  )
}
