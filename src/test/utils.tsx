import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import type { AnyRouter } from '@tanstack/react-router'
import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient()
  const rootRoute = createRootRoute({
    component: () => (
      <ClerkProvider publishableKey="pk_test_stub">
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </ClerkProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(
    <RouterProvider router={router as unknown as AnyRouter} />,
    options,
  )
}

export { createTestQueryClient }
