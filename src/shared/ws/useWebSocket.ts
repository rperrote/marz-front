import { useAuth } from '@clerk/tanstack-react-start'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { DomainEventEnvelope, EventHandler } from './events'

type Status = 'idle' | 'connecting' | 'open' | 'closed'

const SUBSCRIBE_TIMEOUT_MS = 5000

export class SubscribeError extends Error {
  constructor(public code: string) {
    super(code)
    this.name = 'SubscribeError'
  }
}

interface PendingSubscribe {
  resolve: () => void
  reject: (err: SubscribeError) => void
  timer: ReturnType<typeof setTimeout>
}

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
  const [status, dispatchStatus] = useReducer(
    (_current: Status, next: Status) => next,
    'idle',
  )
  const socketRef = useRef<WebSocket | null>(null)
  const pendingSubscribesRef = useRef<Map<string, PendingSubscribe>>(new Map())
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
    const handleOpen = () => dispatchStatus('open')
    const handleClose = () => dispatchStatus('closed')
    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const raw = JSON.parse(event.data) as Record<string, unknown>

        // Control frames for the subscribe protocol live alongside domain
        // events. Resolve/reject the matching pending subscribe before
        // falling through to the domain-event dispatcher.
        const rawType = raw['type']
        if (rawType === 'subscribed') {
          const topic = raw['topic']
          if (typeof topic === 'string') {
            const pending = pendingSubscribesRef.current.get(topic)
            if (pending) {
              clearTimeout(pending.timer)
              pendingSubscribesRef.current.delete(topic)
              pending.resolve()
            }
          }
          return
        }
        if (rawType === 'error') {
          const code =
            typeof raw['code'] === 'string' ? raw['code'] : 'internal'
          // Errors don't carry a topic — fail every pending subscribe with
          // the server code. In practice only one is in-flight at a time.
          for (const [topic, pending] of pendingSubscribesRef.current) {
            clearTimeout(pending.timer)
            pendingSubscribesRef.current.delete(topic)
            pending.reject(new SubscribeError(code))
          }
          return
        }

        // Backend frames are `{ type, data, ... }`. The rest of the chat
        // pipeline expects `{ event_type, payload, ... }` (DomainEventEnvelope).
        // Normalize once here so handlers can stay shape-agnostic.
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
    }

    dispatchStatus('connecting')
    void (async () => {
      // cancelled is mutated by the effect cleanup; the linter's flow
      // analysis can't see across the async boundary.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) return
      const token = await getTokenRef.current()
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

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('close', handleClose)
      ws.addEventListener('message', handleMessage)
    })()

    return () => {
      cancelled = true
      ws?.removeEventListener('open', handleOpen)
      ws?.removeEventListener('close', handleClose)
      ws?.removeEventListener('message', handleMessage)
      ws?.close()
      socketRef.current = null
      for (const [, pending] of pendingSubscribesRef.current) {
        clearTimeout(pending.timer)
        pending.reject(new SubscribeError('disconnected'))
      }
      pendingSubscribesRef.current.clear()
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

  const subscribe = useCallback(
    (topic: string, params: Record<string, unknown> = {}): Promise<void> => {
      const ws = socketRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return Promise.reject(new SubscribeError('not_connected'))
      }
      const pendings = pendingSubscribesRef.current
      const existing = pendings.get(topic)
      if (existing) {
        return Promise.reject(new SubscribeError('already_subscribing'))
      }
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendings.delete(topic)
          reject(new SubscribeError('timeout'))
        }, SUBSCRIBE_TIMEOUT_MS)
        pendings.set(topic, { resolve, reject, timer })
        ws.send(JSON.stringify({ type: 'subscribe', topic, ...params }))
      })
    },
    [],
  )

  const unsubscribe = useCallback(
    (topic: string) => send({ type: 'unsubscribe', topic }),
    [send],
  )

  return { status, send, subscribe, unsubscribe }
}
