import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  /** When true, only the icon is shown (collapsed sidebar). */
  collapsed?: boolean
  onClick?: () => void
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  collapsed = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
        collapsed ? 'size-10 justify-center' : 'w-full px-3 py-2',
        active
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent',
      )}
    >
      <Icon
        className={cn('size-5 shrink-0', active && 'text-sidebar-primary')}
      />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </button>
  )
}
