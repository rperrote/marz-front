import { ExternalLink } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'

interface LinkItemProps {
  url: string
  status?: 'pending' | 'approved' | 'rejected'
  href?: string
}

const badgeByStatus: Record<
  NonNullable<LinkItemProps['status']>,
  { label: () => string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  pending: { label: () => t`Pending`, variant: 'default' },
  approved: { label: () => t`Approved`, variant: 'secondary' },
  rejected: { label: () => t`Rejected`, variant: 'destructive' },
}

export function LinkItem({ url, status = 'pending', href }: LinkItemProps) {
  const statusMeta = badgeByStatus[status]
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
      <a
        href={href ?? url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
      >
        {url}
      </a>
      <Badge variant={statusMeta.variant}>{statusMeta.label()}</Badge>
    </div>
  )
}
