import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import type { Faro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

let faroInstance: Faro | null = null
let initPromise: Promise<Faro | null> | null = null

const HEALTHCHECK_TIMEOUT_MS = 1500
const MAX_CONSECUTIVE_TRANSPORT_FAILURES = 3

async function isCollectorReachable(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    HEALTHCHECK_TIMEOUT_MS,
  )
  try {
    // OPTIONS preflight is cheap and supported by Faro's receiver. Any HTTP
    // response (even 4xx) means the host is up; only network errors disqualify.
    await fetch(url, { method: 'OPTIONS', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function initFaro(): Promise<Faro | null> {
  if (typeof window === 'undefined') return null
  if (faroInstance) return faroInstance
  if (initPromise) return initPromise

  const url = import.meta.env.VITE_FARO_URL
  if (!url) return null

  initPromise = (async () => {
    const reachable = await isCollectorReachable(url)
    if (!reachable) return null

    const apiUrl = import.meta.env.VITE_API_URL
    const propagateTraceHeaderCorsUrls = apiUrl
      ? [new RegExp(apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))]
      : undefined

    let consecutiveFailures = 0
    let paused = false

    faroInstance = initializeFaro({
      url,
      app: {
        name: 'marz-front',
        version: import.meta.env.VITE_FARO_APP_VERSION ?? 'dev',
        environment: import.meta.env.VITE_FARO_ENVIRONMENT ?? 'local',
      },
      beforeSend: (event) => {
        if (paused) return null
        return event
      },
      instrumentations: [
        ...getWebInstrumentations({ captureConsole: true }),
        new TracingInstrumentation({
          instrumentationOptions: {
            propagateTraceHeaderCorsUrls,
          },
        }),
      ],
    })

    // Watchdog: if the collector goes down after init, the transport keeps
    // retrying and Faro's own console.error gets re-captured into a loop.
    // Wrap the transport's send() to count consecutive failures and pause
    // event emission once we cross the threshold.
    const transports = faroInstance.transports.transports
    for (const transport of transports) {
      const originalSend = transport.send.bind(transport)
      transport.send = async (...args) => {
        try {
          const result = await originalSend(...args)
          consecutiveFailures = 0
          return result
        } catch (err) {
          consecutiveFailures += 1
          if (consecutiveFailures >= MAX_CONSECUTIVE_TRANSPORT_FAILURES) {
            paused = true
          }
          throw err
        }
      }
    }

    return faroInstance
  })()

  return initPromise
}

export function getFaro(): Faro | null {
  return faroInstance
}

export function setFaroUser(user: {
  id: string
  username?: string
  attributes?: Record<string, string>
}) {
  faroInstance?.api.setUser(user)
}

export function clearFaroUser() {
  faroInstance?.api.resetUser()
}
