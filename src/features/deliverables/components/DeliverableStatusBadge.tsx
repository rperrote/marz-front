import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type { DeliverableStatus } from '#/features/deliverables/types'

const statusMeta: Record<
  DeliverableStatus,
  {
    label: string
    tone: 'info' | 'success' | 'destructive' | 'neutral' | 'terminal'
  }
> = {
  pending: { label: t`Pending`, tone: 'neutral' },
  draft_submitted: { label: t`In review`, tone: 'info' },
  changes_requested: { label: t`Changes requested`, tone: 'destructive' },
  draft_approved: { label: t`Approved`, tone: 'success' },
  link_submitted: { label: t`Link review`, tone: 'info' },
  link_approved: { label: t`Live`, tone: 'success' },
  completed: { label: t`Completed`, tone: 'success' },
  paid: { label: t`Paid`, tone: 'terminal' },
}

const toneClass: Record<
  (typeof statusMeta)[DeliverableStatus]['tone'],
  string
> = {
  info: 'bg-info text-info-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-muted text-foreground',
  terminal: 'bg-primary text-primary-foreground',
}

interface DeliverableStatusBadgeProps {
  status: DeliverableStatus
  className?: string
}

export function DeliverableStatusBadge({
  status,
  className,
}: DeliverableStatusBadgeProps) {
  const meta = statusMeta[status]

  return (
    <Badge className={cn('rounded-full', toneClass[meta.tone], className)}>
      {meta.label}
    </Badge>
  )
}
