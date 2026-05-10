import {
  initializeFaro,
  getWebInstrumentations
  
} from '@grafana/faro-web-sdk'
import type {Faro} from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

let faroInstance: Faro | null = null

interface InitFaroOptions {
  url: string
  appName: string
  appVersion: string
  environment: string
}

export function initFaro(options: InitFaroOptions): Faro | null {
  if (typeof window === 'undefined') return null
  if (faroInstance) return faroInstance

  faroInstance = initializeFaro({
    url: options.url,
    app: {
      name: options.appName,
      version: options.appVersion,
      environment: options.environment,
    },
    instrumentations: [
      ...getWebInstrumentations({ captureConsole: false }),
      new TracingInstrumentation(),
    ],
  })

  return faroInstance
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
