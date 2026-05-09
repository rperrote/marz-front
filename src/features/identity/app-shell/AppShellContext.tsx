import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

export type AppShellAccountKind = 'brand' | 'creator'

interface AppShellContextValue {
  accountKind: AppShellAccountKind
  accountId: string
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellContextProvider({
  accountKind,
  accountId,
  children,
}: AppShellContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ accountId, accountKind }),
    [accountId, accountKind],
  )

  return <AppShellContext value={value}>{children}</AppShellContext>
}

export function useAppShellContext(): AppShellContextValue {
  const context = useContext(AppShellContext)

  if (!context) {
    throw new Error(
      'useAppShellContext must be used within an AppShellContextProvider',
    )
  }

  return context
}
