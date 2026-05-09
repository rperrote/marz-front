import type { ReactNode } from 'react'

import { AppSidebar } from './AppSidebar'
import { AppShellContextProvider } from './AppShellContext'
import type { AppShellAccountKind } from './AppShellContext'
import { AppTopbar } from './AppTopbar'
import { TopbarProvider } from './TopbarContext'

interface AppShellProps {
  accountKind: AppShellAccountKind
  accountId: string
  pathname: string
  children: ReactNode
}

export function AppShell({
  accountKind,
  accountId,
  pathname,
  children,
}: AppShellProps) {
  return (
    <AppShellContextProvider accountKind={accountKind} accountId={accountId}>
      <TopbarProvider>
        <div
          data-testid="app-shell"
          className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground"
        >
          <AppSidebar accountKind={accountKind} pathname={pathname} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopbar />
            <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </TopbarProvider>
    </AppShellContextProvider>
  )
}
