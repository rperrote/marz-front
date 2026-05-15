import {
  Link,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { routeTree } from './routeTree.gen'
import { getContext } from './integrations/tanstack-query/root-provider'
import { initFaro } from '#/shared/observability/faro'

function DefaultNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-3xl font-semibold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">
        La página que buscás no existe.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  )
}

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: DefaultNotFound,
  })

  if (!router.isServer) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
        release: import.meta.env.VITE_SENTRY_RELEASE,
        tracesSampleRate: Number(
          import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '1.0',
        ),
        sendDefaultPii: true,
      })
    }
    initFaro()
  }

  setupRouterSsrQueryIntegration({
    router,
    // RAFITA:ANY: setupRouterSsrQueryIntegration expects the queryClient type from its own @tanstack/react-query dependency; context.queryClient is the app QueryClient instance, but pnpm can resolve these through different package instances.
    queryClient: context.queryClient as unknown as Parameters<
      typeof setupRouterSsrQueryIntegration
    >[0]['queryClient'],
  })

  return router
}

declare module '@tanstack/react-router' {
  interface HistoryState {
    email?: string
  }

  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
