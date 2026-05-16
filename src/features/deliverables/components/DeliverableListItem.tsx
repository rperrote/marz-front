import {
  ExternalLink,
  Film,
  Instagram,
  Link as LinkIcon,
  Music,
  Plus,
  Twitter,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  DeliverableDTO,
  PublishedLinkStatus,
} from '#/features/deliverables/types'
import { useDeliverableLinks } from '#/features/deliverables/hooks/useDeliverableLinks'
import { useApproveLink } from '#/features/deliverables/hooks/useApproveLink'
import { canMarkDeliverableAsPaid } from '#/shared/payments/markAsPaidPermissions'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import { DraftVersionList } from './DraftVersionList'
import { DeliverableStatusBadge } from './DeliverableStatusBadge'
import { RequestChangesModal } from './RequestChangesModal'
import {
  formatOfferDeadline,
  formatOfferPlatform,
} from '#/features/offers/utils/formatOffer'

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
  sessionKind: 'brand' | 'creator'
  viewerRole?: MarkAsPaidViewer['role']
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (deliverableId: string) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
}

export function DeliverableListItem({
  deliverable,
  sessionKind,
  viewerRole,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
}: DeliverableListItemProps) {
  const PlatformIcon = platformIcon[deliverable.platform] ?? Film
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
    !isNonUploadable &&
    (deliverable.status === 'pending' ||
      deliverable.status === 'changes_requested' ||
      deliverable.status === 'draft_submitted')

  const canSubmitLink =
    isCreator &&
    (deliverable.status === 'draft_approved' ||
      deliverable.status === 'link_submitted')
  const isLinkResubmission =
    deliverable.status === 'link_submitted' || hasPreviousLinkChanges
  const submitLinkLabel = isLinkResubmission ? t`Reenviar link` : t`Enviar link`
  const shouldShowCurrentLink =
    deliverable.status === 'link_submitted' ||
    deliverable.status === 'link_approved' ||
    deliverable.status === 'completed' ||
    linksQuery.data?.current_link_id != null

  const uploadButtonLabel =
    nextVersion === 1 ? t`Subir draft` : t`Subir draft v${nextVersion}`

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

  const formatLabel = formatOfferPlatform(
    deliverable.platform,
    deliverable.format,
  )
  const metaParts: string[] = []
  if (deliverable.deadline)
    metaParts.push(formatOfferDeadline(deliverable.deadline))
  if (deliverable.current_version) {
    const currentVersion = deliverable.current_version
    metaParts.push(t`v${currentVersion}`)
  }
  const metaLine = metaParts.join(' · ')

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 transition-colors',
      )}
    >
      <div className="flex items-center gap-2">
        <PlatformIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {formatLabel}
          </span>
          {metaLine ? (
            <span className="truncate text-xs text-muted-foreground">
              {metaLine}
            </span>
          ) : null}
        </div>
        <DeliverableStatusBadge
          status={deliverable.status}
          className="shrink-0 px-2 py-0.5 text-xs"
        />
      </div>

      {deliverable.current_draft ? (
        <DraftVersionList
          drafts={[deliverable.current_draft]}
          changeRequests={[]}
          deliverableId={deliverable.id}
        />
      ) : null}

      {shouldShowCurrentLink && (
        <CurrentLinkSummary
          deliverableId={deliverable.id}
          deliverableStatus={deliverable.status}
          currentLinkId={linksQuery.data?.current_link_id ?? null}
          links={linksQuery.data?.links ?? []}
          isLoading={linksQuery.isLoading}
          sessionKind={sessionKind}
        />
      )}

      {canUpload ? (
        <button
          type="button"
          onClick={handleUploadClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" />
          {uploadButtonLabel}
        </button>
      ) : canSubmitLink ? (
        <button
          type="button"
          onClick={handleSubmitLinkClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <LinkIcon className="size-3.5" />
          {submitLinkLabel}
        </button>
      ) : canMarkAsPaid ? (
        <button
          type="button"
          onClick={handleMarkAsPaidClick}
          className="flex w-full items-center justify-center rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t`Marcar como pagado`}
        </button>
      ) : null}
    </div>
  )
}

function CurrentLinkSummary({
  deliverableId,
  deliverableStatus,
  currentLinkId,
  links,
  isLoading,
  sessionKind,
}: {
  deliverableId: string
  deliverableStatus: DeliverableDTO['status']
  currentLinkId: string | null
  links: {
    id: string
    url: string
    status: PublishedLinkStatus
  }[]
  isLoading: boolean
  sessionKind: 'brand' | 'creator'
}) {
  if (isLoading) {
    return (
      <div
        className="h-9 animate-pulse rounded-lg bg-muted"
        aria-label={t`Cargando link actual`}
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
        {t`Todavía no hay link.`}
      </div>
    )
  }

  const currentLinkStatusMeta = getCurrentLinkStatusMeta(currentLink.status)
  const linkLabel =
    deliverableStatus === 'link_approved' || deliverableStatus === 'completed'
      ? t`Link aprobado`
      : currentLinkStatusMeta.label

  const showActions =
    sessionKind === 'brand' &&
    deliverableStatus === 'link_submitted' &&
    currentLink.status === 'submitted'

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
        data-testid="current-link-summary"
      >
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
        <a
          href={currentLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-xs font-medium text-info hover:underline"
        >
          {currentLink.url}
        </a>
        <StatusBadge label={linkLabel} tone={currentLinkStatusMeta.tone} />
      </div>
      {showActions ? (
        <CurrentLinkActions
          deliverableId={deliverableId}
          linkId={currentLink.id}
        />
      ) : null}
    </div>
  )
}

function CurrentLinkActions({
  deliverableId,
  linkId,
}: {
  deliverableId: string
  linkId: string
}) {
  const approveLink = useApproveLink(deliverableId, linkId)
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="w-1/2"
        disabled={approveLink.isPending}
        onClick={() => approveLink.mutate()}
      >
        {t`Aprobar`}
      </Button>
      <RequestChangesModal
        title={t`Solicitar cambios en el link`}
        target="link"
        deliverableId={deliverableId}
        linkId={linkId}
        trigger={
          <Button size="sm" variant="outline" className="w-1/2">
            {t`Rechazar`}
          </Button>
        }
      />
    </div>
  )
}

function getCurrentLinkStatusMeta(status: PublishedLinkStatus): {
  label: string
  tone: 'info' | 'success' | 'destructive' | 'neutral'
} {
  if (status === 'approved') {
    return { label: t`Link aprobado`, tone: 'success' }
  }

  if (status === 'changes_requested') {
    return { label: t`Cambios solicitados`, tone: 'destructive' }
  }

  if (status === 'rejected') {
    return { label: t`Rechazado`, tone: 'destructive' }
  }

  return { label: t`Link enviado`, tone: 'neutral' }
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'info' | 'success' | 'destructive' | 'neutral'
}) {
  /* eslint-disable lingui/no-unlocalized-strings */
  const toneClass: Record<typeof tone, string> = {
    info: 'bg-info text-info-foreground',
    success: 'bg-success text-success-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    neutral: 'bg-muted text-foreground',
  }
  /* eslint-enable lingui/no-unlocalized-strings */
  return (
    <Badge className={cn('rounded-full text-[10px]', toneClass[tone])}>
      {label}
    </Badge>
  )
}
