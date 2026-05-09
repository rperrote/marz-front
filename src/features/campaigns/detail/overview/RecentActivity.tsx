import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  Radio,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { CampaignActivityItem } from '#/shared/api/generated/model'

interface RecentActivityProps {
  campaignId: string
  activity: CampaignActivityItem[]
}

const sourceIcons: Record<string, LucideIcon> = {
  application: UserPlus,
  applications: UserPlus,
  discovery: Radio,
  invite: UserPlus,
  offer: FileText,
  offers: FileText,
  deliverable: CheckCircle2,
  deliverables: CheckCircle2,
  payment: CheckCircle2,
  payments: CheckCircle2,
  workspace: MessageSquare,
  conversation: MessageSquare,
  message: MessageSquare,
}

export function RecentActivity({ campaignId, activity }: RecentActivityProps) {
  const sortedActivity = [...activity]
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )
    .slice(0, 5)

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Activity`}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {t`Actividad reciente`}
          </h2>
        </div>
        <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>

      {sortedActivity.length === 0 ? (
        <EmptyActivity campaignId={campaignId} />
      ) : (
        <ol className="mt-4 space-y-3">
          {sortedActivity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ol>
      )}
    </section>
  )
}

function ActivityRow({ item }: { item: CampaignActivityItem }) {
  const Icon = sourceIcons[item.source] ?? Bell

  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-muted/25 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {item.title}
        </p>
        {item.body ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.body}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {formatRelativeTime(item.occurred_at)}
        </p>
      </div>
    </li>
  )
}

function EmptyActivity({ campaignId }: { campaignId: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/25 p-8 text-center">
      <Bell className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        {t`Todavía no hay actividad reciente`}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {t`Cuando haya acciones de participantes, ofertas o entregables van a aparecer acá.`}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
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
  )
}

function formatRelativeTime(iso: string, now = new Date()) {
  const date = new Date(iso)
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return iso

  const diffMs = now.getTime() - timestamp
  const absMs = Math.abs(diffMs)
  const minute = 60_000
  const hour = minute * 60
  const day = hour * 24

  if (absMs < minute) return t`Ahora`
  if (absMs < hour) {
    const minutes = Math.round(absMs / minute)
    return diffMs >= 0 ? t`Hace ${minutes} min` : t`En ${minutes} min`
  }
  if (absMs < day) {
    const hours = Math.round(absMs / hour)
    return diffMs >= 0 ? t`Hace ${hours} h` : t`En ${hours} h`
  }

  const days = Math.round(absMs / day)
  return diffMs >= 0 ? t`Hace ${days} d` : t`En ${days} d`
}

export const recentActivityFormatters = {
  formatRelativeTime,
}
