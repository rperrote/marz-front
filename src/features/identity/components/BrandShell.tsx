import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { AppShell } from '../app-shell/AppShell'

interface BrandShellProps {
  accountId: string
  pathname?: string
  children: ReactNode
}

export function BrandShell({ accountId, pathname, children }: BrandShellProps) {
  const currentPathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <AppShell
      accountKind="brand"
      accountId={accountId}
      pathname={pathname ?? currentPathname}
    >
      {children}
    </AppShell>
  )
}
