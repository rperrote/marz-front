import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

export type TopbarConfig = {
  back?: { label: string; onBack: () => void } | { to: string }
  title?: ReactNode
  progress?: ReactNode
  actions?: ReactNode
}

type TopbarContextValue = {
  config: TopbarConfig | null
  setTopbar: (config: TopbarConfig) => void
  resetTopbar: () => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TopbarConfig | null>(null)

  const setTopbar = useCallback((nextConfig: TopbarConfig) => {
    setConfig(nextConfig)
  }, [])

  const resetTopbar = useCallback(() => {
    setConfig(null)
  }, [])

  const value = useMemo(
    () => ({
      config,
      resetTopbar,
      setTopbar,
    }),
    [config, resetTopbar, setTopbar],
  )

  return (
    <TopbarContext.Provider value={value}>{children}</TopbarContext.Provider>
  )
}

export function useTopbar() {
  const context = useContext(TopbarContext)

  if (!context) {
    throw new Error('useTopbar must be used within a TopbarProvider')
  }

  return context
}
