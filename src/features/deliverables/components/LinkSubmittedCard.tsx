import {
  Copy,
  ExternalLink,
  Instagram,
  Link as LinkIcon,
  Pencil,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
}

interface LinkSubmittedCardBaseProps {
  message: string
  url: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
}

interface LinkSubmittedCardCreatorProps extends LinkSubmittedCardBaseProps {
  audience: 'creator'
  onCopy?: () => void
  onEdit?: () => void
}

interface LinkSubmittedCardBrandProps extends LinkSubmittedCardBaseProps {
  audience: 'brand'
  payoutAmount: string
  onApproveAndPay?: () => void
}

type LinkSubmittedCardProps =
  | LinkSubmittedCardCreatorProps
  | LinkSubmittedCardBrandProps

export function LinkSubmittedCard(props: LinkSubmittedCardProps) {
  const PlatformIcon = platformIcon[props.platform] ?? LinkIcon
  return (
    <SystemEventCard tone="success" kicker="Published link" icon={LinkIcon}>
      <div className="space-y-4">
        <p className="text-sm text-foreground">{props.message}</p>

        <a
          href={props.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2.5 font-mono text-sm text-success transition-colors hover:bg-surface-active"
        >
          <PlatformIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{props.url}</span>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
        </a>

        {props.audience === 'creator' ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={props.onCopy}>
              <Copy />
              Copy URL
            </Button>
            <Button variant="outline" className="flex-1" onClick={props.onEdit}>
              <Pencil />
              Edit
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={props.onApproveAndPay}>
            Approve & Pay {props.payoutAmount}
          </Button>
        )}
      </div>
    </SystemEventCard>
  )
}
