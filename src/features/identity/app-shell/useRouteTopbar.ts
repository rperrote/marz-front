import { useEffect, useMemo } from 'react'

import type { TopbarConfig } from './TopbarContext'
import { useTopbar } from './TopbarContext'

export function useRouteTopbar(config: TopbarConfig) {
  const { resetTopbar, setTopbar } = useTopbar()

  const configKey = useMemo(
    () =>
      JSON.stringify(
        config.breadcrumb.map((segment) => ({
          icon: segment.icon?.displayName ?? segment.icon?.name ?? null,
          label: segment.label,
        })),
      ),
    [config],
  )

  useEffect(() => {
    setTopbar(config)

    return () => {
      resetTopbar()
    }
  }, [configKey, resetTopbar, setTopbar])
}
