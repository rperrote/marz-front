import {
  BarChart3,
  Briefcase,
  BriefcaseBusiness,
  DollarSign,
  Home,
  Inbox,
  Megaphone,
  MessageSquare,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { TooltipProvider } from '#/components/ui/tooltip'

import { AppSidebarItem } from './AppSidebarItem'
import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'

type AppSidebarAccountKind = 'brand' | 'creator'

interface AppSidebarProps {
  accountKind: AppSidebarAccountKind
  pathname: string
  workspaceName?: string
}

const iconByName: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  briefcase: Briefcase,
  'briefcase-business': BriefcaseBusiness,
  'dollar-sign': DollarSign,
  home: Home,
  inbox: Inbox,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  users: Users,
  wallet: Wallet,
}

const DISABLED_TOOLTIP_LABEL = 'Próximamente'

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (initials.length > 0) return initials
  const first = name.trim()[0]
  return first ? first.toUpperCase() : '?'
}

export function AppSidebar({
  accountKind,
  pathname,
  workspaceName,
}: AppSidebarProps) {
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)
  const initials = workspaceName ? getInitials(workspaceName) : '?'

  return (
    <TooltipProvider>
      <aside
        data-testid="app-sidebar"
        data-width="72px"
        aria-label="Navegación principal"
        className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-background py-4"
      >
        <div
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-primary font-bold text-xl text-primary-foreground"
        >
          {initials}
        </div>
        <div className="my-1 h-px w-7 bg-sidebar-border" />
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
