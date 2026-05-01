import { useCallback, useEffect, useRef } from 'react'

const DEBOUNCE_MS = 1000

interface UseTypingPingOptions {
  conversationId: string
  send: (payload: unknown) => void
  enabled?: boolean
}

export function useTypingPing({
  conversationId,
  send,
  enabled = true,
}: UseTypingPingOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sendRef = useRef(send)
  sendRef.current = send

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const ping = useCallback(() => {
    if (!enabled) return
    if (timerRef.current !== undefined) return

    sendRef.current({
      type: 'typing.ping',
      conversation_id: conversationId,
    })

    timerRef.current = setTimeout(() => {
      timerRef.current = undefined
    }, DEBOUNCE_MS)
  }, [conversationId, enabled])

  return { ping }
}
