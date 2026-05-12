import { Film, Instagram, Music, Twitter, Upload, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { formatOfferPlatform } from '#/features/offers/utils/formatOffer'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
  twitter_x: Twitter,
}

interface ExpectedDeliverableSlotProps {
  platform: string
  format: string
  sessionKind: 'brand' | 'creator'
  offerStatus: 'sent' | 'accepted' | 'rejected' | 'expired'
  onUploadDraft?: () => void
}

export function ExpectedDeliverableSlot({
  platform,
  format,
  sessionKind,
  offerStatus,
  onUploadDraft,
}: ExpectedDeliverableSlotProps) {
  const PlatformIcon = platformIcon[platform] ?? Film
  const label = formatOfferPlatform(platform, format)
  const isCreator = sessionKind === 'creator'
  const isAccepted = offerStatus === 'accepted'

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <PlatformIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {label}
          </span>
        </div>
        {isAccepted && !isCreator ? (
          <Badge className="shrink-0 bg-warning px-2 py-0.5 text-xs text-warning-foreground">
            {t`Esperando draft`}
          </Badge>
        ) : null}
      </div>

      {isAccepted && isCreator ? (
        <button
          type="button"
          onClick={onUploadDraft}
          disabled={!onUploadDraft}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-info px-3 py-2 text-xs font-medium text-info-foreground transition-colors hover:bg-info/90 disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {t`Subir draft`}
        </button>
      ) : null}
    </div>
  )
}
