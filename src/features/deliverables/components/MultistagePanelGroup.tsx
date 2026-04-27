import { Check, Lock } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type { StageDTO } from '#/features/deliverables/types'
import { DeliverableListItem } from './DeliverableListItem'
import type { DeliverableListItemProps } from './DeliverableListItem'

interface MultistagePanelGroupProps {
  stage: StageDTO
  deliverables: Array<{
    deliverable: DeliverableListItemProps['deliverable']
    sessionKind: DeliverableListItemProps['sessionKind']
    onUploadDraft: DeliverableListItemProps['onUploadDraft']
  }>
}

const stageStatusMeta: Record<
  StageDTO['status'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  locked: { label: t`Locked`, variant: 'outline' },
  open: { label: t`Open`, variant: 'secondary' },
  approved: { label: t`Approved`, variant: 'default' },
}

export function MultistagePanelGroup({
  stage,
  deliverables,
}: MultistagePanelGroupProps) {
  const meta = stageStatusMeta[stage.status]

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-3',
        stage.status === 'locked' && 'opacity-60',
      )}
    >
      <header className="mb-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {stage.name}
          </span>
          <Badge variant={meta.variant} className="rounded-full text-[10px]">
            {meta.label}
          </Badge>
        </div>
        {stage.status === 'locked' ? (
          <Lock className="size-4 shrink-0 text-muted-foreground" />
        ) : stage.status === 'approved' ? (
          <Check className="size-4 shrink-0 text-success" />
        ) : null}
      </header>

      {stage.deadline ? (
        <div className="mb-2.5 text-xs text-muted-foreground">
          {t`Deadline`}: {stage.deadline}
        </div>
      ) : null}

      <div className="space-y-2">
        {deliverables.map(({ deliverable, sessionKind, onUploadDraft }) => (
          <DeliverableListItem
            key={deliverable.id}
            deliverable={deliverable}
            stageStatus={stage.status}
            sessionKind={sessionKind}
            onUploadDraft={onUploadDraft}
          />
        ))}
      </div>
    </div>
  )
}
