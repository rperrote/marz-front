import { useEffect, useRef } from 'react'

export function useViewedOnce(
  ref: React.RefObject<Element | null>,
  callback: () => void,
) {
  const firedRef = useRef(false)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const element = ref.current
    if (!element || firedRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !firedRef.current) {
          firedRef.current = true
          callbackRef.current()
          observer.disconnect()
        }
      },
      { threshold: 0 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
}
