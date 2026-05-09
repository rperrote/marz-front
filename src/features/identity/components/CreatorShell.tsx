import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { AppShell } from '../app-shell/AppShell'

interface CreatorShellProps {
  accountId: string
  pathname?: string
  children: ReactNode
}

export function CreatorShell({
  accountId,
  pathname,
  children,
}: CreatorShellProps) {
  const currentPathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <AppShell
      accountKind="creator"
      accountId={accountId}
      pathname={pathname ?? currentPathname}
    >
      {children}
    </AppShell>
  )
}
