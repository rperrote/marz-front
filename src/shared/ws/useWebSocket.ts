import { useEffect, useRef, useState } from 'react'
import type { DomainEventEnvelope, EventHandler } from './events'

type Status = 'idle' | 'connecting' | 'open' | 'closed'

interface UseWebSocketOptions {
  /** Map of event_type → handler. Handlers see only matching events. */
  handlers?: Record<string, EventHandler>
  /** Disable actual connection (useful until backend is live). */
  enabled?: boolean
}

/**
 * Thin WebSocket hook. Connects to `VITE_WS_URL`, dispatches incoming
 * domain-event envelopes to handlers keyed by `event_type`.
 *
 * Until marz-api is up, pass `enabled: false` (default) — the hook stays idle
 * and returns a stable no-op `send`.
 *
 * Reconnection with backoff is not implemented yet. When needed, drop in
 * `partysocket` and keep the same interface.
 */
export function useWebSocket({ handlers = {}, enabled = false }: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<Status>('idle')
  const socketRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const url = import.meta.env.VITE_WS_URL
    if (!url) {
      console.warn('[ws] VITE_WS_URL is not set')
      return
    }

    setStatus('connecting')
    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.addEventListener('open', () => setStatus('open'))
    ws.addEventListener('close', () => setStatus('closed'))
    ws.addEventListener('message', (event) => {
      try {
        const envelope = JSON.parse(event.data) as DomainEventEnvelope
        const handler = handlersRef.current[envelope.event_type]
        if (handler) handler(envelope)
      } catch (err) {
        console.error('[ws] failed to parse message', err)
      }
    })

    return () => {
      ws.close()
      socketRef.current = null
    }
  }, [enabled])

  function send(message: unknown) {
    const ws = socketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(typeof message === 'string' ? message : JSON.stringify(message))
    return true
  }

  return { status, send }
}
