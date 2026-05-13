import { useCallback, useState } from 'react'

export function useViewportAtBottom() {
  const [isAtBottom, setIsAtBottom] = useState(true)

  const onAtBottomStateChange = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom)
  }, [])

  return { isAtBottom, onAtBottomStateChange }
}
