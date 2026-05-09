import { useEffect } from 'react'

import type { TopbarConfig } from './TopbarContext'
import { useTopbar } from './TopbarContext'

export function useRouteTopbar(config: TopbarConfig) {
  const { resetTopbar, setTopbar } = useTopbar()

  useEffect(() => {
    setTopbar(config)

    return () => {
      resetTopbar()
    }
  }, [config, resetTopbar, setTopbar])
}
