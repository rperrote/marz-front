import { Instagram, Music, Twitter, X as XIcon, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { IconButton } from '#/shared/ui/IconButton'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
  twitter_x: Twitter,
}

interface BundlePlatformRowProps {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
  label: string
  format: string
  amount: number
  currency?: string
  onChangeAmount?: (value: number) => void
  onRemove?: () => void
}

export function BundlePlatformRow({
  platform,
  label,
  format,
  amount,
  currency = '$',
  onChangeAmount,
  onRemove,
}: BundlePlatformRowProps) {
  const Icon = platformIcon[platform] ?? Music
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {label}
        </div>
        <div className="truncate text-xs text-muted-foreground">{format}</div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-muted pl-3 pr-1">
        <span className="text-sm text-muted-foreground">{currency}</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => onChangeAmount?.(Number(e.target.value))}
          className="w-20 border-0 bg-transparent py-2 text-right font-mono text-sm font-semibold text-foreground outline-none"
        />
      </div>
      <IconButton size="sm" aria-label={`Remove ${label}`} onClick={onRemove}>
        <XIcon />
      </IconButton>
    </div>
  )
}
