import type { ComponentType, ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

const mockNavigate = vi.fn()
const mockRouter = { navigate: mockNavigate }
let mockParams: Record<string, string> = {}

function setupRouterMock() {
  vi.doMock('@tanstack/react-router', () => ({
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
      useParams: () => mockParams,
    }),
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useParams: () => mockParams,
    useRouter: () => mockRouter,
  }))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function getRouteComponent(module: unknown): ComponentType {
  const moduleRecord = asRecord(module)
  const routeRecord = asRecord(moduleRecord?.Route)
  const optionsRecord = asRecord(routeRecord?.options)
  const component = optionsRecord?.component

  if (typeof component !== 'function') {
    throw new Error('Route component missing in test module')
  }

  return component as ComponentType
}

async function renderRouteComponent(importRoute: () => Promise<unknown>) {
  setupRouterMock()

  const [appTopbarModule, topbarContextModule, routeModule] = await Promise.all(
    [
      import('#/features/identity/app-shell/AppTopbar'),
      import('#/features/identity/app-shell/TopbarContext'),
      importRoute(),
    ],
  )
  const { AppTopbar } = appTopbarModule
  const { TopbarProvider } = topbarContextModule
  const Component = getRouteComponent(routeModule)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TopbarProvider>
        <AppTopbar />
        <Component />
      </TopbarProvider>
    </QueryClientProvider>,
  )
}

describe('route topbar integration', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockParams = {}
  })

  afterEach(() => {
    vi.doUnmock('@tanstack/react-router')
    vi.doUnmock('#/features/campaigns/brief-builder/BriefBuilderWizard')
    vi.doUnmock('#/features/campaigns/components/CampaignBriefPage')
  })

  it('declares Campaigns list title and action in the shell topbar', async () => {
    await renderRouteComponent(() => import('./_brand/campaigns.index'))

    expect(await screen.findByText('Campaigns')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /nueva campaña/i }),
    ).toHaveAttribute('href', '/campaigns/new')
    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
  })

  it('declares Offers title in the shell topbar', async () => {
    await renderRouteComponent(() => import('./_creator/offers'))

    expect(await screen.findByText('Offers')).toBeInTheDocument()
    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
  })

  it.todo(
    'declares campaign brief title and parent back link in the shell topbar',
  )

  it.skip('declares campaign brief title and parent back link in the shell topbar (legacy)', async () => {
    mockParams = { campaignId: 'campaign-1' }
    vi.doMock('#/features/campaigns/components/CampaignBriefPage', () => ({
      CampaignBriefPage: ({ campaignId }: { campaignId: string }) => (
        <main>Brief {campaignId}</main>
      ),
    }))

    await renderRouteComponent(
      () => import('./_brand/campaigns.$campaignId.brief'),
    )

    expect(await screen.findByText('Resumen del brief')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute(
      'href',
      '/campaigns',
    )
    expect(screen.getByText('Brief campaign-1')).toBeInTheDocument()
  })

  it('renders brief builder topbar with step label and cancel action', async () => {
    mockParams = { phase: 'review' }
    vi.doMock('#/features/campaigns/brief-builder/BriefBuilderWizard', () => ({
      BriefBuilderWizard: () => <main>Brief builder content</main>,
    }))

    await renderRouteComponent(() => import('./_brand/campaigns.new'))

    expect(await screen.findByText('Fase 3 de 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it.skip('resets contextual topbar state when moving through Campaigns, Chats, and Offers', async () => {
    setupRouterMock()
    const { AppTopbar } =
      await import('#/features/identity/app-shell/AppTopbar')
    const { TopbarProvider } =
      await import('#/features/identity/app-shell/TopbarContext')
    const Campaigns = getRouteComponent(
      await import('./_brand/campaigns.index'),
    )
    const Offers = getRouteComponent(await import('./_creator/offers'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <Campaigns />
        </TopbarProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Campaigns')).toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <main>Chats</main>
        </TopbarProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Marz')).toBeInTheDocument()
    })
    expect(screen.queryByText('Campaigns')).not.toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <Offers />
        </TopbarProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Offers')).toBeInTheDocument()
    expect(screen.queryByText('Campaigns')).not.toBeInTheDocument()
  })

  it('keeps route files free of duplicate route-level header markup', () => {
    const files = [
      'src/routes/_brand/campaigns.index.tsx',
      'src/routes/_brand/campaigns.new.tsx',
      'src/routes/_brand/campaigns.$campaignId.brief.tsx',
      'src/routes/_creator/offers.tsx',
      'src/routes/workspace.tsx',
      'src/routes/workspace.index.tsx',
      'src/routes/workspace.conversations.$conversationId.tsx',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      expect(source).not.toContain('<header')
    }
  })
})
