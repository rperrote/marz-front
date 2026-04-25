import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'

import { BriefBuilderWizard } from './BriefBuilderWizard'
import { useBriefBuilderStore } from './store'

function renderWizard(initialPhase = 'input') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const rootRoute = createRootRoute({
    component: () => (
      <ClerkProvider publishableKey="pk_test_stub">
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
      </ClerkProvider>
    ),
  })

  const wizardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/campaigns/new',
    component: BriefBuilderWizard,
  })

  const phaseRoute = createRoute({
    getParentRoute: () => wizardRoute,
    path: '$phase',
    component: () => {
      const { phase } = phaseRoute.useParams()
      return <div data-testid="phase-content">Phase slug: {phase}</div>
    },
  })

  const routeTree = rootRoute.addChildren([
    wizardRoute.addChildren([phaseRoute]),
  ])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [`/campaigns/new/${initialPhase}`],
    }),
  })

  return render(<RouterProvider router={router} />)
}

describe('BriefBuilderWizard', () => {
  beforeEach(() => {
    useBriefBuilderStore.getState().reset()
  })

  it('renders phase 1 by default', async () => {
    renderWizard('input')
    expect(await screen.findByText('Phase slug: input')).toBeInTheDocument()
  })

  it('shows step label for phase 1', async () => {
    renderWizard('input')
    expect(await screen.findByText('Fase 1 de 4')).toBeInTheDocument()
  })

  it('renders phase 3 when navigated', async () => {
    renderWizard('review')
    expect(await screen.findByText('Phase slug: review')).toBeInTheDocument()
    expect(await screen.findByText('Fase 3 de 4')).toBeInTheDocument()
  })

  it('shows exit button with Cancelar label', async () => {
    renderWizard('input')
    expect(
      await screen.findByRole('button', { name: /cancelar/i }),
    ).toBeInTheDocument()
  })
})
