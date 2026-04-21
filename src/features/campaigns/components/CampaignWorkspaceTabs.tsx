import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'

export interface CampaignTab {
  id: string
  label: string
  icon: LucideIcon
}

interface CampaignWorkspaceTabsProps {
  tabs: Array<CampaignTab>
  activeId: string
  onSelect?: (id: string) => void
}

export function CampaignWorkspaceTabs({
  tabs,
  activeId,
  onSelect,
}: CampaignWorkspaceTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.id === activeId
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect?.(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-1 pb-3 pt-2 text-sm transition-colors',
              active
                ? 'font-semibold text-foreground'
                : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {tab.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
