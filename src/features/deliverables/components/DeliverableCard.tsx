import { Film, Instagram, Music, Plus, Twitter, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { DeliverableStatus } from '#/features/deliverables/types'
import { DeliverableStatusBadge } from './DeliverableStatusBadge'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music,
  twitter_x: Twitter,
}

export interface DraftEntry {
  filename: string
  duration: string
  /** Status for this specific draft version. */
  status?: 'approved' | 'in_review' | 'changes_requested'
}

interface DeliverableCardProps {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
  title: string
  status: DeliverableStatus
  drafts: Array<DraftEntry>
  /** Label for the CTA. "Add draft" when there's history, "Upload draft" when empty. */
  onAddDraft?: () => void
  emptyLabel?: string
}

export function DeliverableCard({
  platform,
  title,
  status,
  drafts,
  onAddDraft,
  emptyLabel = 'Upload draft',
}: DeliverableCardProps) {
  const PlatformIcon = platformIcon[platform] ?? Film
  const hasDrafts = drafts.length > 0

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-3">
        <PlatformIcon className="size-5 shrink-0 text-muted-foreground" />
        <h4 className="flex-1 truncate text-sm font-semibold text-foreground">
          {title}
        </h4>
        <DeliverableStatusBadge status={status} />
      </header>

      {hasDrafts ? (
        <ul className="space-y-2">
          {drafts.map((draft, i) => (
            <DraftRow key={`${draft.filename}-${i}`} draft={draft} />
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={onAddDraft}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
      >
        <Plus className="size-4" />
        {hasDrafts ? 'Add draft' : emptyLabel}
      </button>
    </div>
  )
}

function DraftRow({ draft }: { draft: DraftEntry }) {
  const hasChanges = draft.status === 'changes_requested'
  return (
    <li
      className={cn(
        'relative rounded-lg bg-muted px-3 py-2.5',
        hasChanges && 'border-l-4 border-destructive',
      )}
    >
      {hasChanges ? (
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-destructive">
          ⚠ Changes requested
        </div>
      ) : null}
      <div className="flex items-center gap-2 text-sm">
        <Film className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-mono text-xs text-foreground">
          {draft.filename}
        </span>
        {!hasChanges && draft.status === 'in_review' ? (
          <span className="font-mono text-xs text-muted-foreground">
            {draft.duration} · In review
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {draft.duration}
          </span>
        )}
      </div>
    </li>
  )
}
