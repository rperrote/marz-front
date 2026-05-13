declare module '@grafana/faro-web-sdk' {
  export interface Faro {
    api: {
      setUser: (user: {
        id: string
        username?: string
        attributes?: Record<string, string>
      }) => void
      resetUser: () => void
    }
  }

  export function initializeFaro(options: {
    url: string
    app: {
      name: string
      version: string
      environment: string
    }
    instrumentations: unknown[]
  }): Faro

  export function getWebInstrumentations(options: {
    captureConsole: boolean
  }): unknown[]
}

declare module '@grafana/faro-web-tracing' {
  export class TracingInstrumentation {
    constructor()
  }
}
