import {
  ExternalLink,
  Film,
  Instagram,
  Link as LinkIcon,
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
import type {
  DeliverableDTO,
  PublishedLinkStatus,
  StageStatus,
} from '#/features/deliverables/types'
import { useDeliverableLinks } from '#/features/deliverables/hooks/useDeliverableLinks'
import { canMarkDeliverableAsPaid } from '#/shared/payments/markAsPaidPermissions'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
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
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

export function DeliverableListItem({
  deliverable,
  stageStatus,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: DeliverableListItemProps) {
  const PlatformIcon = platformIcon[deliverable.platform] ?? Film
  const isLocked = stageStatus === 'locked'
  const isNonUploadable = nonUploadableStatuses.has(deliverable.status)

  const isCreator = sessionKind === 'creator'
  const nextVersion = (deliverable.current_version ?? 0) + 1
  const linksQuery = useDeliverableLinks(deliverable.id, {
    enabled: nonUploadableStatuses.has(deliverable.status),
  })
  const hasPreviousLinkChanges =
    linksQuery.data?.links.some(
      (link) => link.status === 'changes_requested',
    ) ?? false

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
  const canSubmitLink =
    isCreator &&
    !isLocked &&
    (deliverable.status === 'draft_approved' ||
      deliverable.status === 'link_submitted')
  const isLinkResubmission =
    deliverable.status === 'link_submitted' || hasPreviousLinkChanges
  const submitLinkLabel = isLinkResubmission
    ? t`Re-submit link`
    : t`Submit link`
  const shouldShowCurrentLink =
    deliverable.status === 'link_submitted' ||
    deliverable.status === 'link_approved' ||
    deliverable.status === 'completed' ||
    linksQuery.data?.current_link_id != null

  const uploadButtonLabel = (() => {
    if (deliverable.status === 'draft_submitted')
      return t`Waiting for brand review`
    return nextVersion === 1 ? t`Upload draft` : t`Upload draft v${nextVersion}`
  })()

  const handleUploadClick = () => {
    onUploadDraft(deliverable.id)
  }

  const canMarkAsPaid = canMarkDeliverableAsPaid({
    viewer: { kind: sessionKind, role: viewerRole },
    deliverableStatus: deliverable.status,
  })

  const handleMarkAsPaidClick = () => {
    onMarkAsPaid?.(deliverable.id)
  }

  const handleSubmitLinkClick = () => {
    onSubmitLink?.(deliverable.id, isLinkResubmission)
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

      {shouldShowCurrentLink && (
        <div className="mt-2.5">
          <CurrentLinkSummary
            deliverableStatus={deliverable.status}
            currentLinkId={linksQuery.data?.current_link_id ?? null}
            links={linksQuery.data?.links ?? []}
            isLoading={linksQuery.isLoading}
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
      ) : canSubmitLink ? (
        <button
          type="button"
          onClick={handleSubmitLinkClick}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <LinkIcon className="size-3.5" />
          {submitLinkLabel}
        </button>
      ) : canMarkAsPaid ? (
        <button
          type="button"
          onClick={handleMarkAsPaidClick}
          className="mt-2.5 flex w-full items-center justify-center rounded-full border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t`Mark as paid`}
        </button>
      ) : null}
    </div>
  )
}

function CurrentLinkSummary({
  deliverableStatus,
  currentLinkId,
  links,
  isLoading,
}: {
  deliverableStatus: DeliverableDTO['status']
  currentLinkId: string | null
  links: {
    id: string
    url: string
    status: PublishedLinkStatus
  }[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div
        className="h-9 animate-pulse rounded-lg bg-muted"
        aria-label={t`Loading current link`}
      />
    )
  }

  const currentLink =
    currentLinkId === null
      ? undefined
      : links.find((link) => link.id === currentLinkId)

  if (!currentLink) {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground"
        data-testid="current-link-empty"
      >
        {t`No current link yet.`}
      </div>
    )
  }

  const currentLinkStatusMeta = getCurrentLinkStatusMeta(currentLink.status)
  const linkLabel =
    deliverableStatus === 'link_approved' || deliverableStatus === 'completed'
      ? t`Link approved`
      : currentLinkStatusMeta.label

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
      data-testid="current-link-summary"
    >
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      <a
        href={currentLink.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-xs font-medium text-info-foreground hover:underline"
      >
        {currentLink.url}
      </a>
      <StatusBadge label={linkLabel} tone={currentLinkStatusMeta.tone} />
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
