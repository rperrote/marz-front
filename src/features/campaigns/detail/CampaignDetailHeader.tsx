import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Sparkles,
} from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { CampaignDetailResponse } from '#/shared/api/generated/model'

interface CampaignDetailHeaderProps {
  detail: CampaignDetailResponse
}

function getStatusLabel(status: string) {
  const labels: Record<string, () => string> = {
    draft: () => t`Borrador`,
    active: () => t`Activa`,
    paused: () => t`Pausada`,
    completed: () => t`Completada`,
  }
  return labels[status]?.() ?? status
}

export function CampaignDetailHeader({ detail }: CampaignDetailHeaderProps) {
  const editButtonDisabled = !detail.action_flags.can_edit
  const editDisabledReason = t`No tenés permisos para editar esta campaña`
  const editButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={editButtonDisabled}
      aria-label={editButtonDisabled ? editDisabledReason : undefined}
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      {t`Editar`}
    </Button>
  )

  return (
    <header className="shrink-0 border-b border-border bg-background px-5 py-5 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Megaphone className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[22px] font-semibold text-foreground">
                {detail.name}
              </h1>
              <Badge className="rounded-full bg-success px-2.5 py-1 text-success-foreground">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                {getStatusLabel(detail.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCampaignSummary(detail)}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              <span>{formatDeadline(detail.deadline)}</span>
              <PlanCapabilities detail={detail} />
            </div>
          </div>
        </div>

        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                to="/campaigns/$campaignId/brief"
                params={{ campaignId: detail.campaign_id }}
                search={{ tab: 'overview', section: 'matches' }}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                {t`Ver brief`}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/workspace"
                search={{
                  filter: 'all',
                  campaign_id: detail.campaign_id,
                }}
              >
                <MessageSquare className="size-3.5" aria-hidden="true" />
                {t`Ir al workspace`}
              </Link>
            </Button>
            {editButtonDisabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{editButton}</span>
                </TooltipTrigger>
                <TooltipContent>{editDisabledReason}</TooltipContent>
              </Tooltip>
            ) : (
              editButton
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t`Más acciones`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}

function PlanCapabilities({ detail }: CampaignDetailHeaderProps) {
  const capabilities = [
    detail.plan_capabilities.allows_automatic_matching
      ? t`Matching automático`
      : null,
    detail.plan_capabilities.allows_campaign_board ? t`Campaign board` : null,
    detail.plan_capabilities.allows_email_invites ? t`Invites por email` : null,
    detail.plan_capabilities.allows_in_platform_invites
      ? t`Invites in-platform`
      : null,
  ].filter((capability): capability is string => capability !== null)

  if (capabilities.length === 0) return null

  return (
    <>
      <span aria-hidden="true">·</span>
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        {capabilities.slice(0, 2).map((capability) => (
          <span
            key={capability}
            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {capability}
          </span>
        ))}
      </span>
    </>
  )
}

function formatCampaignSummary(detail: CampaignDetailResponse) {
  const platforms =
    detail.platforms.length > 0 ? detail.platforms : [t`Sin plataformas`]
  return [detail.objective, ...platforms].join(' · ')
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return t`Sin deadline`

  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return deadline

  return t`Deadline ${new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)}`
}

export function CampaignDetailHeaderSkeleton() {
  return (
    <header className="shrink-0 border-b border-border bg-background px-5 py-5 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3.5">
          <div className="size-12 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded-full bg-muted" />
            <div className="h-4 w-80 max-w-full rounded-full bg-muted" />
            <div className="h-4 w-52 rounded-full bg-muted" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-md bg-muted" />
          <div className="h-8 w-32 rounded-md bg-muted" />
          <div className="h-8 w-20 rounded-md bg-muted" />
        </div>
      </div>
    </header>
  )
}

export function CampaignDetailHeaderError({
  className,
}: {
  className?: string
}) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-border bg-background px-5 py-5 md:px-8',
        className,
      )}
    >
      <div className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold text-foreground">
          {t`No encontramos esta campaña`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Puede que no exista o que no pertenezca a este workspace.`}
        </p>
      </div>
    </header>
  )
}
