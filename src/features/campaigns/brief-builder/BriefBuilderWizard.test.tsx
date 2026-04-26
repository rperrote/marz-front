import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
import { trackBriefBuilderAbandoned } from './analytics/brief-builder-analytics'

const { mockProceed, mockBlockerReset } = vi.hoisted(() => ({
  mockProceed: vi.fn(),
  mockBlockerReset: vi.fn(),
}))

let mockBlockerStatus: 'idle' | 'blocked' = 'idle'
let mockIsDirty = false

vi.mock('./analytics/brief-builder-analytics', () => ({
  trackBriefBuilderAbandoned: vi.fn(),
}))

vi.mock('./hooks/useLeaveGuard', () => ({
  useLeaveGuard: () => ({
    blocker: {
      status: mockBlockerStatus,
      proceed: mockProceed,
      reset: mockBlockerReset,
      current: undefined,
      next: undefined,
      action: undefined,
    },
    isDirty: mockIsDirty,
  }),
}))

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
    vi.clearAllMocks()
    mockBlockerStatus = 'idle'
    mockIsDirty = false
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

  describe('leave guard', () => {
    it('shows confirmation dialog when blocker is blocked', async () => {
      mockBlockerStatus = 'blocked'
      mockIsDirty = true
      renderWizard('review')

      expect(
        await screen.findByText('¿Salir del brief builder?'),
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'Vas a perder el progreso del brief. Esta acción no se puede deshacer.',
        ),
      ).toBeInTheDocument()
    })

    it('does not show dialog when blocker is idle', async () => {
      mockBlockerStatus = 'idle'
      renderWizard('review')

      await screen.findByText('Phase slug: review')
      expect(
        screen.queryByText('¿Salir del brief builder?'),
      ).not.toBeInTheDocument()
    })

    it('calls proceed + trackAbandoned + reset on confirm', async () => {
      const user = userEvent.setup()
      mockBlockerStatus = 'blocked'
      mockIsDirty = true
      useBriefBuilderStore.setState({
        currentPhase: 3,
        processingToken: 'tok-test',
      })

      renderWizard('review')
      await screen.findByText('¿Salir del brief builder?')
      await user.click(screen.getByRole('button', { name: /salir/i }))

      expect(trackBriefBuilderAbandoned).toHaveBeenCalledWith({
        phase: 3,
        processing_token: 'tok-test',
      })
      expect(mockProceed).toHaveBeenCalledOnce()
    })

    it('calls blocker.reset on cancel', async () => {
      const user = userEvent.setup()
      mockBlockerStatus = 'blocked'
      mockIsDirty = true

      renderWizard('review')
      await screen.findByText('¿Salir del brief builder?')
      await user.click(screen.getByRole('button', { name: /seguir editando/i }))

      expect(mockBlockerReset).toHaveBeenCalledOnce()
      expect(mockProceed).not.toHaveBeenCalled()
    })

    it('does not show dialog when campaignId is set', async () => {
      mockBlockerStatus = 'idle'
      mockIsDirty = false
      useBriefBuilderStore.setState({ campaignId: 'camp-1', currentPhase: 4 })

      renderWizard('confirm')
      await screen.findByText('Phase slug: confirm')
      expect(
        screen.queryByText('¿Salir del brief builder?'),
      ).not.toBeInTheDocument()
    })
  })
})
