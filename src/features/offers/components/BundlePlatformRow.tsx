import { Instagram, Music, Youtube, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { IconButton } from '#/shared/ui/IconButton'

const platformIcon: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
}

interface BundlePlatformRowProps {
  platform: string
  index?: number
  onRemove: () => void
  children: ReactNode
}

export function BundlePlatformRow({
  platform,
  index,
  onRemove,
  children,
}: BundlePlatformRowProps) {
  const Icon = platformIcon[platform] ?? Music

  return (
    <fieldset className="rounded-xl border border-border bg-background p-4">
      <legend className="sr-only">
        {index !== undefined ? t`Deliverable ${index + 1}` : t`Deliverable`}
      </legend>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        <IconButton
          size="sm"
          aria-label={t`Remove deliverable`}
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </fieldset>
  )
}
