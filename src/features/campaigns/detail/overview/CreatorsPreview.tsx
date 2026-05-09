import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { CampaignCreatorPreview } from '#/shared/api/generated/model'
import { formatPlatform, initials } from '#/shared/utils/format'

interface CreatorsPreviewProps {
  campaignId: string
  creators: CampaignCreatorPreview[]
}

function getStatusLabel(status: string) {
  const labels: Record<string, () => string> = {
    accepted: () => t`Aceptado`,
    active: () => t`Activo`,
    invited: () => t`Invitado`,
    applied: () => t`Aplicó`,
    rejected: () => t`Rechazado`,
    completed: () => t`Completado`,
  }
  return labels[status]?.() ?? status
}

export function CreatorsPreview({
  campaignId,
  creators,
}: CreatorsPreviewProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Creators`}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {t`Participantes`}
          </h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            to="/campaigns/$campaignId"
            params={{ campaignId }}
            search={{ tab: 'creators', section: 'matches' }}
          >
            {t`Ver creators`}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {creators.length === 0 ? (
        <EmptyCreators campaignId={campaignId} />
      ) : (
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {creators.map((preview) => (
            <CreatorRow key={preview.creator.account_id} preview={preview} />
          ))}
        </div>
      )}
    </section>
  )
}

function CreatorRow({ preview }: { preview: CampaignCreatorPreview }) {
  const creator = preview.creator
  const platform = creator.primary_platform
    ? formatPlatform(creator.primary_platform.platform)
    : t`Sin plataforma`
  const deliverables = t`${preview.deliverables_completed}/${preview.deliverables_expected} entregables`

  return (
    <article className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10">
          {creator.avatar_url ? (
            <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
          ) : null}
          <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {creator.display_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            @{creator.handle} · {platform}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">{deliverables}</span>
        <Badge variant="outline">{getStatusLabel(preview.status)}</Badge>
      </div>
    </article>
  )
}

function EmptyCreators({ campaignId }: { campaignId: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/25 p-8 text-center">
      <Search className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        {t`Todavía no hay creators participantes`}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {t`Explorá Discovery para contactar perfiles y sumar participantes a esta campaña.`}
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link
          to="/campaigns/$campaignId"
          params={{ campaignId }}
          search={{ tab: 'discovery', section: 'matches' }}
        >
          <Search className="size-3.5" aria-hidden="true" />
          {t`Ir a Discovery`}
        </Link>
      </Button>
    </div>
  )
}
