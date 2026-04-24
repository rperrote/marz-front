import {
  Link,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getContext } from './integrations/tanstack-query/root-provider'

function DefaultNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-3xl font-bold text-foreground">404</h1>
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

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

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
