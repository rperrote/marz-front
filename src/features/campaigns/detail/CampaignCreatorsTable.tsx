import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Compass,
  Ellipsis,
  Instagram,
  MessageSquare,
  Music,
  Plus,
  Search,
  Twitch,
  UserPlus,
  X,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  CampaignParticipantListItem,
  ListCampaignParticipantsPlatform,
  ListCampaignParticipantsStatus,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { formatRelativeTime, initials } from '#/shared/utils/format'

import { InviteCreatorDialog } from './creators/InviteCreatorDialog'
import { useCampaignParticipantsQuery } from './creators/useCampaignParticipantsQuery'
import type { CampaignParticipantsParams } from './creators/useCampaignParticipantsQuery'

export type CampaignCreatorsTableScope =
  | { type: 'campaign'; campaignId: string; allowsInPlatformInvites: boolean }
  | { type: 'global'; brandWorkspaceId: string }

interface CampaignCreatorsTableProps {
  scope: CampaignCreatorsTableScope
  params: CampaignParticipantsParams
  onParamsChange: (params: CampaignParticipantsParams) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onFindCreators: () => void
  onInviteCreatorReady?: (openInviteCreator: (() => void) | null) => void
}

function getStatusLabel(status: ListCampaignParticipantsStatus) {
  const labels: Record<ListCampaignParticipantsStatus, () => string> = {
    invited: () => t`Invited`,
    active: () => t`Active`,
    in_review: () => t`In review`,
    approved: () => t`Approved`,
    paid: () => t`Paid`,
  }
  return labels[status]()
}

const statusClassNames: Record<ListCampaignParticipantsStatus, string> = {
  invited: 'border-border bg-background text-muted-foreground',
  active: 'bg-primary text-primary-foreground',
  in_review: 'bg-success text-success-foreground',
  approved: 'bg-secondary text-secondary-foreground',
  paid: 'bg-accent text-accent-foreground',
}

const platformMeta: Record<
  ListCampaignParticipantsPlatform,
  { label: string; icon: LucideIcon }
> = {
  youtube: { label: 'YouTube', icon: Youtube },
  instagram: { label: 'Instagram', icon: Instagram },
  tiktok: { label: 'TikTok', icon: Music },
  x: { label: 'X', icon: X },
  twitch: { label: 'Twitch', icon: Twitch },
}

export function CampaignCreatorsTable({
  scope,
  params,
  onParamsChange,
  hasActiveFilters,
  onClearFilters,
  onFindCreators,
  onInviteCreatorReady,
}: CampaignCreatorsTableProps) {
  if (scope.type === 'global') {
    return (
      <TableFrame>
        <EmptyTableState
          icon={Search}
          title={t`Creators global todavía no está disponible`}
          description={t`Esta tabla ya acepta scope global para conectarse cuando exista el endpoint.`}
          action={null}
        />
      </TableFrame>
    )
  }

  return (
    <CampaignScopedCreatorsTable
      scope={scope}
      params={params}
      onParamsChange={onParamsChange}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      onFindCreators={onFindCreators}
      onInviteCreatorReady={onInviteCreatorReady}
    />
  )
}

function CampaignScopedCreatorsTable({
  scope,
  params,
  onParamsChange,
  hasActiveFilters,
  onClearFilters,
  onFindCreators,
  onInviteCreatorReady,
}: Omit<CampaignCreatorsTableProps, 'scope'> & {
  scope: Extract<CampaignCreatorsTableScope, { type: 'campaign' }>
}) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const openInviteCreator = useCallback(() => setInviteDialogOpen(true), [])

  useEffect(() => {
    onInviteCreatorReady?.(openInviteCreator)
    return () => onInviteCreatorReady?.(null)
  }, [onInviteCreatorReady, openInviteCreator])

  const participantsQuery = useCampaignParticipantsQuery(
    scope.campaignId,
    params,
  )
  const participants = participantsQuery.data?.data ?? []
  const totalVisible = participantsQuery.data?.total_visible ?? 0

  if (participantsQuery.isPending) {
    return (
      <>
        <TableFrame>
          <TableSkeleton />
        </TableFrame>
        <InviteCreatorDialog
          campaignId={scope.campaignId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          allowsInPlatformInvites={scope.allowsInPlatformInvites}
        />
      </>
    )
  }

  if (participantsQuery.error) {
    return (
      <>
        <TableFrame>
          <ErrorState error={participantsQuery.error} />
        </TableFrame>
        <InviteCreatorDialog
          campaignId={scope.campaignId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          allowsInPlatformInvites={scope.allowsInPlatformInvites}
        />
      </>
    )
  }

  if (totalVisible === 0) {
    return (
      <>
        <TableFrame>
          <EmptyTableState
            icon={hasActiveFilters ? Search : UserPlus}
            title={
              hasActiveFilters
                ? t`No encontramos creators con esos filtros`
                : t`Todavía no hay creators en esta campaña`
            }
            description={
              hasActiveFilters
                ? t`Probá con otra búsqueda, estado o plataforma.`
                : t`Cuando invites creators desde Discovery o agregues uno manualmente, aparecerán acá con su estado y entregables.`
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={onClearFilters}
                >
                  {t`Clear filters`}
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={onFindCreators}
                  >
                    <Compass className="size-4" aria-hidden />
                    {t`Find creators`}
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={openInviteCreator}
                  >
                    <Plus className="size-4" aria-hidden />
                    {t`Invite creator`}
                  </Button>
                </div>
              )
            }
          />
        </TableFrame>
        <InviteCreatorDialog
          campaignId={scope.campaignId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          allowsInPlatformInvites={scope.allowsInPlatformInvites}
        />
      </>
    )
  }

  return (
    <>
      <TableFrame>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <HeaderRow />
            <div className="divide-y divide-border">
              {participants.map((participant) => (
                <CreatorRow
                  key={participant.participant_id}
                  participant={participant}
                  campaignId={scope.campaignId}
                  onInviteCreator={openInviteCreator}
                />
              ))}
            </div>
          </div>
        </div>
        {participantsQuery.data.next_cursor ? (
          <div className="flex justify-center border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                onParamsChange({
                  ...params,
                  cursor: participantsQuery.data.next_cursor ?? undefined,
                })
              }
            >
              {t`Load more`}
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}
      </TableFrame>
      <InviteCreatorDialog
        campaignId={scope.campaignId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        allowsInPlatformInvites={scope.allowsInPlatformInvites}
      />
    </>
  )
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  )
}

function HeaderRow() {
  return (
    <div className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 border-b border-border bg-muted px-5 py-3">
      <HeaderCell>{t`Creator`}</HeaderCell>
      <HeaderCell>{t`Platform`}</HeaderCell>
      <HeaderCell>{t`Status`}</HeaderCell>
      <HeaderCell>{t`Deliverables`}</HeaderCell>
      <HeaderCell>{t`Last activity`}</HeaderCell>
      <span className="sr-only">{t`Actions`}</span>
    </div>
  )
}

function HeaderCell({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}

function CreatorRow({
  participant,
  campaignId,
  onInviteCreator,
}: {
  participant: CampaignParticipantListItem
  campaignId: string
  onInviteCreator: () => void
}) {
  const navigate = useNavigate()
  const primaryPlatform = getPrimaryPlatform(participant)

  return (
    <div className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover/70">
      <CreatorCell participant={participant} />
      <PlatformCell platform={primaryPlatform} />
      <StatusBadge status={participant.status} />
      <DeliverablesCell deliverables={participant.net_deliverables} />
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(participant.last_activity_at, t`Pending response`)}
      </span>
      <div className="flex justify-end gap-1">
        {participant.actions.open_workspace ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t`Open workspace`}
            onClick={() => {
              if (participant.conversation_id) {
                void navigate({
                  to: '/workspace/conversations/$conversationId',
                  params: { conversationId: participant.conversation_id },
                  search: { filter: 'all', campaign_id: campaignId },
                })
                return
              }
              void navigate({
                to: '/workspace',
                search: { filter: 'all', campaign_id: campaignId },
              })
            }}
          >
            <MessageSquare className="size-3.5" aria-hidden />
          </Button>
        ) : null}
        {participant.actions.invite_creator ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t`Invite creator`}
            onClick={onInviteCreator}
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        ) : null}
        {!participant.actions.open_workspace &&
        !participant.actions.invite_creator ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t`Creator actions`}
            disabled
          >
            <Ellipsis className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function CreatorCell({
  participant,
}: {
  participant: CampaignParticipantListItem
}) {
  const creator = participant.creator

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10">
        {creator.avatar_url ? (
          <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
        ) : null}
        <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {creator.display_name}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          @{creator.handle}
        </p>
      </div>
    </div>
  )
}

function PlatformCell({
  platform,
}: {
  platform: ListCampaignParticipantsPlatform | undefined
}) {
  if (!platform) {
    return <span className="text-xs text-muted-foreground">{t`None`}</span>
  }

  const meta = platformMeta[platform]
  const Icon = meta.icon

  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span>{meta.label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (isParticipantStatus(status)) {
    return (
      <Badge className={cn('rounded-full', statusClassNames[status])}>
        {getStatusLabel(status)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="rounded-full">
      {status}
    </Badge>
  )
}

function DeliverablesCell({
  deliverables,
}: {
  deliverables: CampaignParticipantListItem['net_deliverables']
}) {
  const expected = deliverables.expected
  const completed = deliverables.completed
  const percent = expected > 0 ? Math.min(100, (completed / expected) * 100) : 0

  return (
    <div className="space-y-1">
      <p
        className={cn(
          'text-xs',
          completed > 0 ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {t`${completed} of ${expected} delivered`}
      </p>
      <div className="h-1.5 w-[140px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function EmptyTableState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-muted">
        <Icon className="size-12 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <EmptyTableState
      icon={AlertCircle}
      title={
        isNotFound
          ? t`No encontramos los creators`
          : t`No pudimos cargar los creators`
      }
      description={
        isNotFound
          ? t`Puede que la campaña no exista o que no pertenezca a este workspace.`
          : t`Reintentá en unos minutos.`
      }
      action={null}
    />
  )
}

function TableSkeleton() {
  return (
    <div role="status" aria-label={t`Loading creators`}>
      <div className="h-11 border-b border-border bg-muted" />
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-muted" />
              <div className="h-2.5 w-24 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-muted" />
            <div className="h-1.5 w-32 rounded-full bg-muted" />
          </div>
          <div className="h-3 w-20 rounded-full bg-muted" />
          <div className="ml-auto size-6 rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}

function getPrimaryPlatform(participant: CampaignParticipantListItem) {
  for (const platform of participant.platforms) {
    if (isParticipantPlatform(platform)) return platform
  }

  for (const platform of participant.creator.platforms) {
    if (isParticipantPlatform(platform.platform)) return platform.platform
  }

  return undefined
}

function isParticipantStatus(
  status: string,
): status is ListCampaignParticipantsStatus {
  return Object.hasOwn(statusClassNames, status)
}

function isParticipantPlatform(
  platform: string,
): platform is ListCampaignParticipantsPlatform {
  return Object.hasOwn(platformMeta, platform)
}
