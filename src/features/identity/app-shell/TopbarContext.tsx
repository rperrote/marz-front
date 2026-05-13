import { createContext, use, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type TopbarBreadcrumbSegment = { icon?: LucideIcon; label: string }

export type TopbarConfig = { breadcrumb: TopbarBreadcrumbSegment[] }

type TopbarContextValue = {
  config: TopbarConfig | null
  setTopbar: (config: TopbarConfig) => void
  resetTopbar: () => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function TopbarProvider({
  children,
  initialConfig = null,
}: {
  children: ReactNode
  initialConfig?: TopbarConfig | null
}) {
  const [config, setConfig] = useState<TopbarConfig | null>(null)
  const activeConfig = initialConfig ?? config

  const setTopbar = useCallback((nextConfig: TopbarConfig) => {
    setConfig(nextConfig)
  }, [])

  const resetTopbar = useCallback(() => {
    setConfig(null)
  }, [])

  const value = useMemo(
    () => ({
      config: activeConfig,
      resetTopbar,
      setTopbar,
    }),
    [activeConfig, resetTopbar, setTopbar],
  )

  return <TopbarContext value={value}>{children}</TopbarContext>
}

export function useTopbar() {
  const context = use(TopbarContext)

  if (!context) {
    throw new Error('useTopbar must be used within a TopbarProvider')
  }

  return context
}
