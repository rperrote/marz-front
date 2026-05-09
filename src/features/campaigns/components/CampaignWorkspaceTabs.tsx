import type { LucideIcon } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

export interface CampaignTab {
  id: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  tooltip?: string
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
    <TooltipProvider>
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => (
          <CampaignWorkspaceTabButton
            key={tab.id}
            tab={tab}
            active={tab.id === activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

function CampaignWorkspaceTabButton({
  tab,
  active,
  onSelect,
}: {
  tab: CampaignTab
  active: boolean
  onSelect?: (id: string) => void
}) {
  const Icon = tab.icon
  const button = (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-disabled={tab.disabled ? 'true' : undefined}
      onClick={() => {
        if (tab.disabled) return
        onSelect?.(tab.id)
      }}
      className={cn(
        'relative flex items-center gap-2 rounded-xl px-1 pb-3 pt-2 text-sm transition-colors',
        active
          ? 'font-semibold text-foreground'
          : 'font-medium text-muted-foreground hover:text-foreground',
        tab.disabled &&
          'cursor-not-allowed text-muted-foreground/55 hover:text-muted-foreground/55',
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

  if (!tab.disabled || !tab.tooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tab.tooltip}</TooltipContent>
    </Tooltip>
  )
}
