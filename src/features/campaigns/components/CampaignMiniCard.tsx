import { Badge } from '#/components/ui/badge'

interface CampaignMiniCardProps {
  name: string
  startDate: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  creators: number
  budget: string
  videos: {
    done: number
    total: number
  }
  platforms: Array<string>
}

const statusMeta: Record<
  CampaignMiniCardProps['status'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'secondary' },
}

export function CampaignMiniCard({
  name,
  startDate,
  status,
  creators,
  budget,
  videos,
  platforms,
}: CampaignMiniCardProps) {
  const badge = statusMeta[status]
  const pct = videos.total > 0 ? Math.round((videos.done / videos.total) * 100) : 0

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
          <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {startDate}
          </div>
        </div>
        <Badge variant={badge.variant} className="rounded-full">
          {badge.label}
        </Badge>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Creators" value={String(creators)} />
        <Stat label="Budget" value={budget} />
        <Stat label="Videos" value={`${videos.done}/${videos.total}`} align="right" />
      </dl>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>

      <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{pct}% complete</span>
        <span>{platforms.join(' · ')}</span>
      </footer>
    </article>
  )
}

function Stat({
  label,
  value,
  align = 'left',
}: {
  label: string
  value: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-base font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}
