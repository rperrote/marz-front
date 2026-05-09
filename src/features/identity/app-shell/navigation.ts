export interface ShellNavigationItem {
  id: string
  label: string
  icon: string
  href?: string
  disabled?: boolean
  disabledReason?: string
}

export interface ShellNavigationConfig {
  brand: ShellNavigationItem[]
  creator: ShellNavigationItem[]
}

const DISABLED_REASON = 'Próximamente'

export const shellNavigationConfig: ShellNavigationConfig = {
  brand: [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: 'inbox',
      href: '/inbox',
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: 'message-square',
      href: '/workspace',
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: 'megaphone',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
    {
      id: 'creators',
      label: 'Creators',
      icon: 'users',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'bar-chart-3',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
  ],
  creator: [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: 'inbox',
      href: '/inbox',
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: 'message-square',
      href: '/workspace',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'bar-chart-3',
      disabled: true,
      disabledReason: DISABLED_REASON,
    },
  ],
}

export function resolveActiveSidebarItem(
  items: ShellNavigationItem[],
  pathname: string,
): ShellNavigationItem | null {
  let activeItem: ShellNavigationItem | null = null
  let activeHrefLength = 0

  for (const item of items) {
    if (item.disabled || !item.href) {
      continue
    }

    const matchesPath =
      pathname === item.href || pathname.startsWith(`${item.href}/`)

    if (!matchesPath) {
      continue
    }

    if (!activeItem || item.href.length > activeHrefLength) {
      activeItem = item
      activeHrefLength = item.href.length
    }
  }

  return activeItem
}
