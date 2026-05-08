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
import { DraftVersionList } from './DraftVersionList'
import { DeliverableStatusBadge } from './DeliverableStatusBadge'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
  twitter_x: Twitter,
}

const nonUploadableStatuses: ReadonlySet<DeliverableDTO['status']> = new Set([
  'draft_approved',
  'link_submitted',
  'link_approved',
  'completed',
  'paid',
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
  const isLocked = stageStatus === 'locked'
  const isNonUploadable = nonUploadableStatuses.has(deliverable.status)

  const isCreator = sessionKind === 'creator'
  const nextVersion = (deliverable.current_version ?? 0) + 1

  const canUpload =
    isCreator &&
    !isLocked &&
    !isNonUploadable &&
    (deliverable.status === 'pending' ||
      deliverable.status === 'changes_requested')

  const isUploadDisabled =
    isCreator &&
    !isLocked &&
    !isNonUploadable &&
    deliverable.status === 'draft_submitted'

  const uploadButtonLabel = (() => {
    if (deliverable.status === 'draft_submitted')
      return t`Waiting for brand review`
    return nextVersion === 1 ? t`Upload draft` : t`Upload draft v${nextVersion}`
  })()

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
            <DeliverableStatusBadge
              status={deliverable.status}
              className="text-[10px]"
            />
            {deliverable.change_requests_count > 0 && (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {deliverable.change_requests_count} {t`rounds`}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {deliverable.deadline ? <span>{deliverable.deadline}</span> : null}
            {deliverable.current_version ? (
              <span>v{deliverable.current_version}</span>
            ) : null}
          </div>
        </div>
      </div>

      {deliverable.drafts.length > 0 && (
        <div className="mt-2.5">
          <DraftVersionList
            drafts={deliverable.drafts}
            changeRequests={deliverable.change_requests}
            deliverableId={deliverable.id}
          />
        </div>
      )}

      {canUpload || isUploadDisabled ? (
        <button
          type="button"
          disabled={isUploadDisabled}
          onClick={handleUploadClick}
          className={cn(
            'mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs font-medium transition-colors',
            isUploadDisabled
              ? 'cursor-not-allowed text-muted-foreground opacity-60'
              : 'text-foreground hover:bg-muted',
          )}
        >
          <Plus className="size-3.5" />
          {uploadButtonLabel}
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
