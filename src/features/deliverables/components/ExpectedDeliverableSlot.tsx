import { Film, Instagram, Music, Plus, Twitter, Youtube } from 'lucide-react'
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
  onUploadDraft?: () => void
}

export function ExpectedDeliverableSlot({
  platform,
  format,
  sessionKind,
  onUploadDraft,
}: ExpectedDeliverableSlotProps) {
  const PlatformIcon = platformIcon[platform] ?? Film
  const label = formatOfferPlatform(platform, format)
  const isCreator = sessionKind === 'creator'

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <PlatformIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {label}
          </span>
        </div>
        <Badge className="shrink-0 bg-info px-2 py-0.5 text-xs text-info-foreground">
          {t`Waiting draft`}
        </Badge>
      </div>

      {isCreator && onUploadDraft ? (
        <button
          type="button"
          onClick={onUploadDraft}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" />
          {t`Upload draft`}
        </button>
      ) : null}
    </div>
  )
}
