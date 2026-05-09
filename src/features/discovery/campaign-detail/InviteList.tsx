import { t } from '@lingui/core/macro'
import { Mail, Send } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import type { CampaignInviteListItem } from '#/shared/api/generated/model'

import { formatDate, initials } from './utils'

interface InviteListProps {
  invites: CampaignInviteListItem[]
}

export function InviteList({ invites }: InviteListProps) {
  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <InviteRow key={invite.invite_id} invite={invite} />
      ))}
    </div>
  )
}

function InviteRow({ invite }: { invite: CampaignInviteListItem }) {
  const creator = invite.creator
  const label =
    creator?.display_name ??
    invite.invited_email ??
    invite.invited_handle ??
    t`Invitación`

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        {creator ? (
          <Avatar className="size-10">
            {creator.avatar_url ? (
              <AvatarImage src={creator.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {invite.mode === 'email' ? (
              <Mail className="size-4" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {label}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {creator ? `@${creator.handle}` : formatInviteMode(invite.mode)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground md:inline">
          {formatDate(invite.created_at)}
        </span>
        <Badge variant="outline">{formatStatus(invite.status)}</Badge>
      </div>
    </article>
  )
}

function formatInviteMode(mode: string) {
  if (mode === 'email') return t`Email`
  if (mode === 'in_platform') return t`In-platform`
  return mode
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: t`Pendiente`,
    accepted: t`Aceptada`,
    expired: t`Expirada`,
    cancelled: t`Cancelada`,
  }

  return labels[status] ?? status
}
