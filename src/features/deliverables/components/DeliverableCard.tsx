import {
  ExternalLink,
  Film,
  Instagram,
  Music,
  Plus,
  Twitter,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { Badge } from '#/components/ui/badge'
import type {
  DeliverableStatus,
  PublishedLinkStatus,
} from '#/features/deliverables/types'
import { DeliverableStatusBadge } from './DeliverableStatusBadge'

const linkToneClass: Record<
  'info' | 'success' | 'destructive' | 'neutral',
  string
> = {
  info: 'bg-info text-info-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-muted text-foreground',
}

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
  currentLink?: {
    url: string
    status: PublishedLinkStatus
  } | null
}

export function DeliverableCard({
  platform,
  title,
  status,
  drafts,
  onAddDraft,
  emptyLabel = 'Upload draft',
  currentLink = null,
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

      {currentLink ? (
        <div className="mt-3">
          <CurrentLinkSummary deliverableStatus={status} link={currentLink} />
        </div>
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

function CurrentLinkSummary({
  deliverableStatus,
  link,
}: {
  deliverableStatus: DeliverableStatus
  link: {
    url: string
    status: PublishedLinkStatus
  }
}) {
  const meta = getCurrentLinkStatusMeta(link.status)
  const label =
    deliverableStatus === 'link_approved' || deliverableStatus === 'completed'
      ? t`Link approved`
      : meta.label

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-xs font-medium text-info-foreground hover:underline"
      >
        {link.url}
      </a>
      <Badge className={cn('rounded-full', linkToneClass[meta.tone])}>
        {label}
      </Badge>
    </div>
  )
}

function getCurrentLinkStatusMeta(status: PublishedLinkStatus): {
  label: string
  tone: 'info' | 'success' | 'destructive' | 'neutral'
} {
  if (status === 'approved') {
    return { label: t`Link approved`, tone: 'success' }
  }

  if (status === 'changes_requested') {
    return { label: t`Changes requested`, tone: 'destructive' }
  }

  if (status === 'rejected') {
    return { label: t`Rejected`, tone: 'destructive' }
  }

  return { label: t`Link submitted`, tone: 'neutral' }
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
