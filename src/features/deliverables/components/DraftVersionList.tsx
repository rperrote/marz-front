import { useState } from 'react'
import { Play } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import { cn } from '#/lib/utils'
import type { DraftDTO, ChangeRequestDTO } from '#/features/deliverables/types'
import { InlineVideoPlayer } from './InlineVideoPlayer'

interface DraftVersionListProps {
  drafts: DraftDTO[]
  changeRequests: ChangeRequestDTO[]
  deliverableId?: string
}

function getStatusMeta(status: 'approved' | 'changes_requested' | 'submitted') {
  const map: Record<typeof status, { label: string; className: string }> = {
    approved: {
      label: t`Approved`,
      className: 'bg-success text-success-foreground',
    },
    changes_requested: {
      label: t`Changes requested`,
      className: 'bg-warning text-warning-foreground',
    },
    submitted: {
      label: t`Submitted`,
      className: 'bg-info text-info-foreground',
    },
  }
  return map[status]
}

function getDraftStatus(
  draft: DraftDTO,
  changeRequestDraftIds: ReadonlySet<string>,
): 'approved' | 'changes_requested' | 'submitted' {
  if (draft.approved_at != null) return 'approved'
  if (changeRequestDraftIds.has(draft.id)) return 'changes_requested'
  return 'submitted'
}

export function DraftVersionList({
  drafts,
  changeRequests,
  deliverableId,
}: DraftVersionListProps) {
  const [previewDraft, setPreviewDraft] = useState<DraftDTO | null>(null)
  const maxVersion = Math.max(...drafts.map((d) => d.version), 0)

  const changeRequestDraftIds = new Set<string>(
    changeRequests.map((cr) => cr.draft_id),
  )

  if (drafts.length === 0) return null

  return (
    <div className="space-y-2" data-testid="draft-version-list">
      {drafts.map((draft) => {
        const isCurrent = draft.version === maxVersion
        const status = getDraftStatus(draft, changeRequestDraftIds)
        const meta = getStatusMeta(status)

        return (
          <div
            key={draft.id}
            data-testid="draft-version-row"
            data-version={draft.version}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2"
          >
            <span className="text-xs font-medium text-foreground">
              v{draft.version}
            </span>
            {isCurrent && (
              <Badge className="rounded-full bg-accent text-accent-foreground text-[10px]">
                {t`Current`}
              </Badge>
            )}
            <Badge className={cn('rounded-full text-[10px]', meta.className)}>
              {meta.label}
            </Badge>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={t`Play draft v${draft.version}`}
              onClick={() => setPreviewDraft(draft)}
            >
              <Play className="size-4" />
            </Button>
          </div>
        )
      })}

      {previewDraft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPreviewDraft(null)
          }}
        >
          <DialogContent
            className="max-w-lg"
            aria-labelledby="preview-draft-title"
            aria-describedby={undefined}
          >
            <DialogTitle id="preview-draft-title" className="sr-only">
              {t`Preview draft v${previewDraft.version}`}
            </DialogTitle>
            <InlineVideoPlayer
              playbackUrl={previewDraft.playback_url}
              thumbnailUrl={previewDraft.thumbnail_url ?? undefined}
              durationSec={previewDraft.duration_sec ?? undefined}
              deliverableId={deliverableId}
              draftId={previewDraft.id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
