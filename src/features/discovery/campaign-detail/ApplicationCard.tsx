import { t } from '@lingui/core/macro'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import type { CampaignApplicationListItem } from '#/shared/api/generated/model'

import { formatDate, initials } from './utils'

interface ApplicationCardProps {
  application: CampaignApplicationListItem
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const creator = application.creator

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="size-11">
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
              @{creator.handle}
            </p>
          </div>
        </div>
        <Badge variant="outline">{formatStatus(application.status)}</Badge>
      </div>
      <p className="mt-4 line-clamp-3 text-sm text-foreground">
        {application.message}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {application.proposed_rate ? (
          <span>{t`Rate ${application.proposed_rate.amount}`}</span>
        ) : null}
        <span>{formatDate(application.created_at)}</span>
      </div>
    </article>
  )
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: t`Pendiente`,
    accepted: t`Aceptada`,
    rejected: t`Rechazada`,
  }

  return labels[status] ?? status
}
