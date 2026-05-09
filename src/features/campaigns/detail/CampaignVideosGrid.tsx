import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Film,
  Instagram,
  Music,
  Play,
  Search,
  Twitch,
  UserPlus,
  Video,
  X,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  CampaignVideoCard,
  CampaignVideoCardPlatform,
  DeliverableStatus,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { formatRelativeTime, initials } from '#/shared/utils/format'

import type { CampaignVideosParams } from './videos/useCampaignVideosQuery'
import { useCampaignVideosQuery } from './videos/useCampaignVideosQuery'

export type CampaignVideosGridScope =
  | { type: 'campaign'; campaignId: string }
  | { type: 'global'; brandWorkspaceId: string }

interface CampaignVideosGridProps {
  scope: CampaignVideosGridScope
  params: CampaignVideosParams
  hasActiveFilters: boolean
  hasActiveParticipants: boolean
  onParamsChange: (params: CampaignVideosParams) => void
  onClearFilters: () => void
  onInviteCreators: () => void
}

function getVideoStatusLabel(status: DeliverableStatus) {
  const labels: Record<DeliverableStatus, () => string> = {
    pending: () => t`Pending`,
    draft_submitted: () => t`In review`,
    changes_requested: () => t`Changes requested`,
    draft_approved: () => t`Approved draft`,
    link_submitted: () => t`Link submitted`,
    link_approved: () => t`Link approved`,
    completed: () => t`Completed`,
    paid: () => t`Paid`,
  }
  return labels[status]()
}

const statusClassNames: Record<DeliverableStatus, string> = {
  pending: 'border-border bg-background text-muted-foreground',
  draft_submitted: 'bg-warning text-warning-foreground',
  changes_requested: 'bg-destructive text-destructive-foreground',
  draft_approved: 'bg-success text-success-foreground',
  link_submitted: 'bg-info text-info-foreground',
  link_approved: 'bg-success text-success-foreground',
  completed: 'bg-success text-success-foreground',
  paid: 'bg-accent text-accent-foreground',
}

const platformMeta: Record<
  CampaignVideoCardPlatform,
  { label: string; icon: LucideIcon }
> = {
  youtube: { label: 'YouTube', icon: Youtube },
  instagram: { label: 'Instagram', icon: Instagram },
  tiktok: { label: 'TikTok', icon: Music },
  x: { label: 'X', icon: X },
  twitch: { label: 'Twitch', icon: Twitch },
}

export function CampaignVideosGrid({
  scope,
  params,
  hasActiveFilters,
  hasActiveParticipants,
  onParamsChange,
  onClearFilters,
  onInviteCreators,
}: CampaignVideosGridProps) {
  if (scope.type === 'global') {
    return (
      <GridFrame>
        <EmptyGridState
          icon={Search}
          title={t`Videos global todavía no está disponible`}
          description={t`Este grid ya acepta scope global para conectarse cuando exista el endpoint.`}
          action={null}
        />
      </GridFrame>
    )
  }

  return (
    <CampaignScopedVideosGrid
      scope={scope}
      params={params}
      hasActiveFilters={hasActiveFilters}
      hasActiveParticipants={hasActiveParticipants}
      onParamsChange={onParamsChange}
      onClearFilters={onClearFilters}
      onInviteCreators={onInviteCreators}
    />
  )
}

function CampaignScopedVideosGrid({
  scope,
  params,
  hasActiveFilters,
  hasActiveParticipants,
  onParamsChange,
  onClearFilters,
  onInviteCreators,
}: Omit<CampaignVideosGridProps, 'scope'> & {
  scope: Extract<CampaignVideosGridScope, { type: 'campaign' }>
}) {
  const videosQuery = useCampaignVideosQuery(scope.campaignId, params)
  const videos = videosQuery.data?.data ?? []
  const totalVisible = videosQuery.data?.total_visible ?? 0

  if (videosQuery.isPending) {
    return (
      <GridFrame>
        <GridSkeleton />
      </GridFrame>
    )
  }

  if (videosQuery.error) {
    return (
      <GridFrame>
        <ErrorState error={videosQuery.error} />
      </GridFrame>
    )
  }

  if (totalVisible === 0) {
    return (
      <GridFrame>
        <EmptyGridState
          icon={
            hasActiveFilters ? Search : hasActiveParticipants ? Video : UserPlus
          }
          title={
            hasActiveFilters
              ? t`No encontramos videos con esos filtros`
              : t`Todavía no hay videos entregados`
          }
          description={
            hasActiveFilters
              ? t`Probá con otra búsqueda, estado, plataforma o creator.`
              : hasActiveParticipants
                ? t`Los videos van a aparecer acá cuando los creators suban sus drafts y queden en revisión o aprobados.`
                : t`Invitá creators para empezar a recibir entregables en esta campaña.`
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
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onInviteCreators}
              >
                <UserPlus className="size-4" aria-hidden />
                {hasActiveParticipants
                  ? t`View active creators`
                  : t`Invite creators`}
              </Button>
            )
          }
        />
      </GridFrame>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.deliverable_id} video={video} />
        ))}
      </div>
      {videosQuery.data.next_cursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              onParamsChange({
                ...params,
                cursor: videosQuery.data.next_cursor ?? undefined,
              })
            }
          >
            {t`Load more`}
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function VideoCard({ video }: { video: CampaignVideoCard }) {
  const meta = platformMeta[video.platform]
  const PlatformIcon = meta.icon
  const submittedAt = formatRelativeTime(
    video.submitted_at ?? video.updated_at,
    t`Pending`,
  )

  return (
    <Link
      to={video.reviewer_url}
      className="group overflow-hidden rounded-[20px] border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label={t`Open video reviewer for ${video.creator.display_name}`}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt=""
            className="size-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="size-full bg-[linear-gradient(135deg,var(--muted),var(--secondary))]" />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={video.status} />
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            <PlatformIcon className="size-3" aria-hidden />
            {meta.label}
          </span>
        </div>
        <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm">
          <Play className="size-4 fill-current" aria-hidden />
        </span>
        {video.duration_sec ? (
          <span className="absolute right-3 bottom-3 rounded-lg bg-black/70 px-2 py-0.5 font-mono text-[11px] text-white">
            {formatDuration(video.duration_sec)}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {video.format}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Film className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{meta.label}</span>
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-6">
            {video.creator.avatar_url ? (
              <AvatarImage
                src={video.creator.avatar_url}
                alt={video.creator.display_name}
              />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {initials(video.creator.display_name)}
            </AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {video.creator.display_name} · {submittedAt}
          </p>
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: DeliverableStatus }) {
  return (
    <Badge className={cn('rounded-full px-2 py-0.5', statusClassNames[status])}>
      {getVideoStatusLabel(status)}
    </Badge>
  )
}

function GridFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  )
}

function EmptyGridState({
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
    <EmptyGridState
      icon={AlertCircle}
      title={
        isNotFound
          ? t`No encontramos los videos`
          : t`No pudimos cargar los videos`
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

function GridSkeleton() {
  return (
    <div
      role="status"
      aria-label={t`Loading videos`}
      className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[20px] border border-border bg-card"
        >
          <div className="aspect-video bg-muted" />
          <div className="space-y-3 p-3">
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-muted" />
              <div className="h-3 w-1/2 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDuration(durationSec: number) {
  const totalSeconds = Math.max(0, Math.round(durationSec))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
