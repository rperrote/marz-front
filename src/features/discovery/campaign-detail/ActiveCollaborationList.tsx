import { t } from '@lingui/core/macro'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import type { CampaignActiveListItem } from '#/shared/api/generated/model'

import { formatDate, initials } from './utils'

interface ActiveCollaborationListProps {
  collaborations: CampaignActiveListItem[]
}

export function ActiveCollaborationList({
  collaborations,
}: ActiveCollaborationListProps) {
  return (
    <div className="space-y-3">
      {collaborations.map((collaboration) => (
        <ActiveRow
          key={collaboration.active_id}
          collaboration={collaboration}
        />
      ))}
    </div>
  )
}

function ActiveRow({
  collaboration,
}: {
  collaboration: CampaignActiveListItem
}) {
  const creator = collaboration.creator

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10">
          {creator.avatar_url ? (
            <AvatarImage src={creator.avatar_url} alt="" />
          ) : null}
          <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {creator.display_name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            @{creator.handle} · {formatSource(collaboration.source)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {collaboration.last_activity_at ? (
          <span className="hidden text-xs text-muted-foreground md:inline">
            {formatDate(collaboration.last_activity_at)}
          </span>
        ) : null}
        <Badge variant="outline">{formatStatus(collaboration.status)}</Badge>
      </div>
    </article>
  )
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    match: t`Match`,
    application: t`Aplicación`,
    invite: t`Invitación`,
  }

  return labels[source] ?? source
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    active: t`Activa`,
    accepted: t`Aceptada`,
    completed: t`Completada`,
  }

  return labels[status] ?? status
}
