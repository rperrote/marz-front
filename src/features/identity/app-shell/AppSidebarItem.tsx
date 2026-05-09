import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

interface AppSidebarItemProps {
  label: string
  icon: LucideIcon
  href?: string
  active: boolean
  disabled: boolean
  tooltipLabel: string
}

export function AppSidebarItem({
  label,
  icon: Icon,
  href,
  active,
  disabled,
  tooltipLabel,
}: AppSidebarItemProps) {
  const itemClassName = cn(
    'flex size-11 items-center justify-center rounded-[20px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    active
      ? 'bg-sidebar-accent text-primary'
      : 'bg-transparent text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
    disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled || !href ? (
          <button
            type="button"
            aria-label={label}
            aria-disabled={disabled ? 'true' : undefined}
            className={itemClassName}
          >
            <Icon aria-hidden="true" className="size-[22px]" />
          </button>
        ) : (
          <Link
            to={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={itemClassName}
          >
            <Icon aria-hidden="true" className="size-[22px]" />
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        collisionPadding={8}
        className="rounded-xl border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  )
}
