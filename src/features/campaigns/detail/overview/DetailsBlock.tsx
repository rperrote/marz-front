import { t } from '@lingui/core/macro'
import { CalendarClock, CircleDollarSign, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import type { CampaignOverviewResponse } from '#/shared/api/generated/model'

import { formatPlatform } from '#/shared/utils/format'

import { campaignOverviewFormatters } from './StatsBlock'

interface DetailsBlockProps {
  overview: CampaignOverviewResponse
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

export function DetailsBlock({ overview }: DetailsBlockProps) {
  const campaign = overview.campaign
  const budget = `${campaignOverviewFormatters.formatUsd(
    overview.budget_spent_usd,
  )} / ${campaignOverviewFormatters.formatUsd(overview.budget_total_usd)}`

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Campaign details`}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {campaign.name}
          </h2>
        </div>
        <Badge variant="outline" className="px-2.5 py-1">
          {getStatusLabel(campaign.status)}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <FeaturedDetail
          icon={Target}
          label={t`Objective`}
          value={campaign.objective}
        />
        <FeaturedDetail
          icon={CalendarClock}
          label={t`Deadline`}
          value={formatDeadline(campaign.deadline)}
        />
        <FeaturedDetail
          icon={CircleDollarSign}
          label={t`Budget`}
          value={budget}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5">
        <DetailRow
          label={t`Platforms`}
          value={formatList(campaign.platforms)}
        />
        <DetailRow
          label={t`Audience`}
          value={campaign.audience_description ?? t`Sin audiencia definida`}
        />
        <DetailRow
          label={t`Content model`}
          value={campaign.content_model ?? t`Sin modelo definido`}
        />
        <DetailRow
          label={t`Pricing model`}
          value={campaign.pricing_model ?? t`Sin pricing definido`}
        />
      </dl>
    </section>
  )
}

function FeaturedDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/35 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return t`Sin deadline`

  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return deadline

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatList(items: string[]) {
  if (items.length === 0) return t`Sin plataformas`
  return items.map(formatPlatform).join(', ')
}
