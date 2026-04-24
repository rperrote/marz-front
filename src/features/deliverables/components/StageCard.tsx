import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { IconButton } from '#/shared/ui/IconButton'
import { cn } from '#/lib/utils'

export type StageStatus = 'upcoming' | 'active' | 'done'

interface StageCardProps {
  stageNumber: number
  name: string
  deadline: string
  status: StageStatus
  /** When collapsed=false and children present, renders the nested deliverables. */
  collapsed?: boolean
  onToggle?: () => void
  children?: ReactNode
}

const statusMeta: Record<
  StageStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline'
    kickerTone: string
  }
> = {
  upcoming: {
    label: 'Upcoming',
    variant: 'outline',
    kickerTone: 'text-muted-foreground',
  },
  active: { label: 'Active', variant: 'secondary', kickerTone: 'text-primary' },
  done: {
    label: 'Done',
    variant: 'default',
    kickerTone: 'text-muted-foreground',
  },
}

export function StageCard({
  stageNumber,
  name,
  deadline,
  status,
  collapsed = false,
  onToggle,
  children,
}: StageCardProps) {
  const meta = statusMeta[status]
  const isCollapsed = collapsed || !children

  return (
    <div className={cn('rounded-xl bg-muted p-4', !isCollapsed && 'space-y-4')}>
      <header className="flex items-start gap-3">
        <div className="flex-1">
          <div
            className={cn(
              'text-xs font-semibold uppercase tracking-widest',
              meta.kickerTone,
            )}
          >
            Stage {stageNumber}
          </div>
          <div className="mt-0.5 text-base font-semibold text-foreground">
            {name}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {status !== 'active' ? (
            <Badge variant={meta.variant} className="rounded-full">
              {meta.label}
            </Badge>
          ) : null}
          <span className="font-mono">{deadline}</span>
          {onToggle ? (
            <IconButton
              size="sm"
              shape="circle"
              aria-label="Toggle stage"
              onClick={onToggle}
            >
              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
            </IconButton>
          ) : null}
        </div>
      </header>

      {!isCollapsed ? <div className="space-y-3">{children}</div> : null}
    </div>
  )
}
