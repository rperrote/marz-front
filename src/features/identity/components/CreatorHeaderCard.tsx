import { ChevronDown, ChevronUp } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { IconButton } from '#/shared/ui/IconButton'

export interface CreatorStat {
  label: string
  value: string
}

interface CreatorHeaderCardProps {
  name: string
  handle: string
  avatarUrl?: string
  avatarFallback?: string
  /** When provided, renders a stats row below (used in the "expanded" variant). */
  stats?: Array<CreatorStat>
  collapsed?: boolean
  onToggle?: () => void
}

export function CreatorHeaderCard({
  name,
  handle,
  avatarUrl,
  avatarFallback,
  stats,
  collapsed = false,
  onToggle,
}: CreatorHeaderCardProps) {
  const showStats = stats && stats.length > 0 && !collapsed

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-4 p-4">
        <Avatar className="size-14">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>{avatarFallback ?? initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-foreground">{name}</div>
          <div className="truncate font-mono text-sm text-primary">{handle}</div>
        </div>
        {onToggle ? (
          <IconButton shape="circle" aria-label="Toggle creator details" onClick={onToggle}>
            {collapsed ? <ChevronDown /> : <ChevronUp />}
          </IconButton>
        ) : null}
      </div>

      {showStats ? (
        <div className="grid grid-cols-3 gap-4 border-t border-border px-4 py-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-xl font-semibold text-foreground">{stat.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
