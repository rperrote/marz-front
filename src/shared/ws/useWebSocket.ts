import { useAuth } from '@clerk/tanstack-react-start'
import { useCallback, useEffect, useRef, useState } from 'react'
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
export function useWebSocket({
  handlers = {},
  enabled = false,
}: UseWebSocketOptions = {}) {
  const { getToken } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const socketRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  // Keep a ref to getToken so the connection effect doesn't depend on it
  // (Clerk returns a new function reference on every render — using it as
  // an effect dep tears down and rebuilds the socket on every render,
  // causing the rapid subscribe/unsubscribe loop callers observe).
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const baseUrl = import.meta.env.VITE_WS_URL
    if (!baseUrl) {
      console.warn('[ws] VITE_WS_URL is not set')
      return
    }

    let ws: WebSocket | null = null
    let cancelled = false

    setStatus('connecting')
    void (async () => {
      const token = await getTokenRef.current()
      // cancelled is mutated by the effect cleanup; the linter's flow
      // analysis can't see across the async boundary.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) return
      if (!token) {
        console.warn('[ws] no Clerk token available; not connecting')
        return
      }
      // Backend reads the JWT from the Sec-WebSocket-Protocol header
      // (the only header the browser exposes on a WS handshake).
      // Format agreed with backend: ['bearer', <jwt>].
      ws = new WebSocket(baseUrl, ['bearer', token])
      socketRef.current = ws

      ws.addEventListener('open', () => setStatus('open'))
      ws.addEventListener('close', () => setStatus('closed'))
      ws.addEventListener('message', (event) => {
        try {
          // Backend frames are `{ type, data, ... }`. The rest of the chat
          // pipeline expects `{ event_type, payload, ... }` (DomainEventEnvelope).
          // Normalize once here so handlers can stay shape-agnostic.
          const raw = JSON.parse(event.data) as Record<string, unknown>
          const envelope = {
            ...raw,
            event_type: (raw['event_type'] ?? raw['type'] ?? raw['event']) as
              | string
              | undefined,
            payload: raw['payload'] ?? raw['data'],
          } as DomainEventEnvelope
          if (!envelope.event_type) return
          const handler = handlersRef.current[envelope.event_type]
          if (handler) handler(envelope)
        } catch (err) {
          console.error('[ws] failed to parse message', err)
        }
      })
    })()

    return () => {
      cancelled = true
      ws?.close()
      socketRef.current = null
    }
  }, [enabled])

  // Stable identity so callers that depend on `send` in their effect deps
  // don't re-run on every render of this hook.
  const send = useCallback((message: unknown) => {
    const ws = socketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(typeof message === 'string' ? message : JSON.stringify(message))
    return true
  }, [])

  return { status, send }
}
