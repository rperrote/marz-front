import {
  Film,
  Instagram,
  Lock,
  Music,
  Plus,
  Twitter,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type { DeliverableDTO, StageStatus } from '#/features/deliverables/types'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
  twitter_x: Twitter,
}

const statusMeta: Record<
  DeliverableDTO['status'],
  { label: string; tone: 'info' | 'success' | 'destructive' | 'neutral' }
> = {
  pending: { label: t`Pending`, tone: 'neutral' },
  draft_submitted: { label: t`In review`, tone: 'info' },
  changes_requested: { label: t`Changes requested`, tone: 'destructive' },
  draft_approved: { label: t`Approved`, tone: 'success' },
  link_submitted: { label: t`Link review`, tone: 'info' },
  link_approved: { label: t`Live`, tone: 'success' },
  completed: { label: t`Completed`, tone: 'success' },
}

const nonUploadableStatuses: ReadonlySet<DeliverableDTO['status']> = new Set([
  'draft_approved',
  'link_submitted',
  'link_approved',
  'completed',
])

export interface DeliverableListItemProps {
  deliverable: DeliverableDTO
  stageStatus?: StageStatus
  sessionKind: 'brand' | 'creator'
  onUploadDraft: (deliverableId: string) => void
}

export function DeliverableListItem({
  deliverable,
  stageStatus,
  sessionKind,
  onUploadDraft,
}: DeliverableListItemProps) {
  const PlatformIcon = platformIcon[deliverable.platform] ?? Film
  const badge = statusMeta[deliverable.status]
  const isLocked = stageStatus === 'locked'
  const isNonUploadable = nonUploadableStatuses.has(deliverable.status)
  const canUpload = sessionKind === 'creator' && !isLocked && !isNonUploadable

  const handleUploadClick = () => {
    onUploadDraft(deliverable.id)
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-3 transition-colors',
        isLocked && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <PlatformIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {deliverable.format}
            </span>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {deliverable.deadline ? <span>{deliverable.deadline}</span> : null}
            {deliverable.current_version ? (
              <span>v{deliverable.current_version}</span>
            ) : null}
          </div>
        </div>
      </div>

      {canUpload ? (
        <button
          type="button"
          onClick={handleUploadClick}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" />
          {t`Upload draft`}
        </button>
      ) : sessionKind === 'creator' && isLocked ? (
        <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs font-medium text-muted-foreground opacity-60">
          <Lock className="size-3.5" />
          {t`Upload draft`}
        </div>
      ) : null}
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'info' | 'success' | 'destructive' | 'neutral'
}) {
  const toneClass: Record<typeof tone, string> = {
    info: 'bg-info text-info-foreground',
    success: 'bg-success text-success-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    neutral: 'bg-muted text-foreground',
  }
  return (
    <Badge className={cn('rounded-full text-[10px]', toneClass[tone])}>
      {label}
    </Badge>
  )
}
