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
  pending: { label: t`Pendiente`, tone: 'neutral' },
  draft_submitted: { label: t`En revisión`, tone: 'info' },
  changes_requested: { label: t`Cambios solicitados`, tone: 'destructive' },
  draft_approved: { label: t`Aprobado`, tone: 'success' },
  link_submitted: { label: t`Revisión de link`, tone: 'info' },
  link_approved: { label: t`En vivo`, tone: 'success' },
  completed: { label: t`Completado`, tone: 'success' },
  paid: { label: t`Pagado`, tone: 'terminal' },
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
