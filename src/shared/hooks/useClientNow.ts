import { useCallback, useRef, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getServerNow = () => null

export function useClientNow(intervalMs?: number): number | null {
  const intervalMsRef = useRef(intervalMs)
  const currentNowRef = useRef<number | null>(null)
  intervalMsRef.current = intervalMs

  const getNow = useCallback(() => {
    currentNowRef.current ??= Date.now()
    return currentNowRef.current
  }, [])

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!intervalMsRef.current) return emptySubscribe()

    let timeoutId: number | null = null

    const tick = () => {
      currentNowRef.current = Date.now()
      onStoreChange()
      const nextIntervalMs = intervalMsRef.current
      if (nextIntervalMs) {
        timeoutId = window.setTimeout(tick, nextIntervalMs)
      }
    }

    timeoutId = window.setTimeout(tick, intervalMsRef.current)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  return useSyncExternalStore(subscribe, getNow, getServerNow)
}
