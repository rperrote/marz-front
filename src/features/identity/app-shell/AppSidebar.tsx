import {
  BarChart3,
  BriefcaseBusiness,
  DollarSign,
  Home,
  Inbox,
  Megaphone,
  MessageSquare,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { TooltipProvider } from '#/components/ui/tooltip'

import { AppSidebarItem } from './AppSidebarItem'
import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'

type AppSidebarAccountKind = 'brand' | 'creator'

interface AppSidebarProps {
  accountKind: AppSidebarAccountKind
  pathname: string
}

const iconByName: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  'briefcase-business': BriefcaseBusiness,
  'dollar-sign': DollarSign,
  home: Home,
  inbox: Inbox,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  users: Users,
}

const DISABLED_TOOLTIP_LABEL = 'Próximamente'

export function AppSidebar({ accountKind, pathname }: AppSidebarProps) {
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)

  return (
    <TooltipProvider>
      <aside
        data-testid="app-sidebar"
        data-width="72px"
        aria-label="Navegación principal"
        className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-background py-4"
      >
        {items.map((item) => {
          const Icon = iconByName[item.icon] ?? Inbox
          const disabled = item.disabled === true

          return (
            <AppSidebarItem
              key={item.id}
              label={item.label}
              icon={Icon}
              href={item.href}
              active={activeItem?.id === item.id}
              disabled={disabled}
              tooltipLabel={disabled ? DISABLED_TOOLTIP_LABEL : item.label}
            />
          )
        })}
      </aside>
    </TooltipProvider>
  )
}
