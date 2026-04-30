import { useCallback, useState } from 'react'

const DEFAULT_TOLERANCE_PX = 50

export function useViewportAtBottom() {
  const [isAtBottom, setIsAtBottom] = useState(true)

  const onAtBottomStateChange = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom)
  }, [])

  return { isAtBottom, onAtBottomStateChange }
}

export { DEFAULT_TOLERANCE_PX }
