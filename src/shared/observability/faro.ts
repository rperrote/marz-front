import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import type { Faro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

let faroInstance: Faro | null = null

export function initFaro(): Faro | null {
  if (typeof window === 'undefined') return null
  if (faroInstance) return faroInstance

  const url = import.meta.env.VITE_FARO_URL
  if (!url) return null

  const apiUrl = import.meta.env.VITE_API_URL
  const propagateTraceHeaderCorsUrls = apiUrl
    ? [new RegExp(apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))]
    : undefined

  faroInstance = initializeFaro({
    url,
    app: {
      name: 'marz-front',
      version: import.meta.env.VITE_FARO_APP_VERSION ?? 'dev',
      environment: import.meta.env.VITE_FARO_ENVIRONMENT ?? 'local',
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
  return faroInstance
}
