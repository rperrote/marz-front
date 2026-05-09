import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { BrandPaymentsSpendingResponse } from '../api/brandPaymentsSchemas'
import { useBrandPaymentsSpendingQuery } from '../hooks/useBrandPaymentsSpendingQuery'
import { BrandPaymentsPage } from './BrandPaymentsPage'

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

vi.mock('../hooks/useBrandPaymentsSpendingQuery', () => {
  return {
    getBrandPaymentsSpendingQueryKey: (
      workspaceId: string,
      input: { filters: { period: string } },
    ) => ['brand-payments-spending', workspaceId, input.filters],
    useBrandPaymentsSpendingQuery: vi.fn(),
  }
})

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'acct-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

const mockUseBrandPaymentsSpendingQuery = vi.mocked(
  useBrandPaymentsSpendingQuery,
)

function renderPage(
  response: BrandPaymentsSpendingResponse,
  onFiltersChange = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  mockUseBrandPaymentsSpendingQuery.mockReturnValue({
    data: { pages: [response], pageParams: [undefined] },
    isPending: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isError: false,
  } as unknown as ReturnType<typeof useBrandPaymentsSpendingQuery>)

  const view = render(
    <QueryClientProvider client={queryClient}>
      <BrandPaymentsPage
        filters={{ period: '30d' }}
        onFiltersChange={onFiltersChange}
      />
    </QueryClientProvider>,
  )

  return { ...view, onFiltersChange }
}

describe('BrandPaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the USD-only dashboard and updates period through search params callback', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    renderPage(makeResponse(), onFiltersChange)

    expect(screen.getByText('$184,250.00')).toBeInTheDocument()
    expect(screen.getByText('$42,820.00')).toBeInTheDocument()
    expect(screen.getByText('$8,430.00')).toBeInTheDocument()
    expect(screen.getByText('$3,200.00')).toBeInTheDocument()
    expect(screen.queryByText(/currency/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '90d' }))

    expect(onFiltersChange).toHaveBeenCalledWith({ period: '90d' })
  })

  it('renders visually distinct empty states for no payments and filtered no results', () => {
    const { rerender } = renderPage(makeResponse({ totalSpent: '0', rows: [] }))

    expect(screen.getByText('Todavía no hay pagos')).toBeInTheDocument()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockUseBrandPaymentsSpendingQuery.mockReturnValue({
      data: {
        pages: [makeResponse({ totalSpent: '184250', rows: [] })],
        pageParams: [undefined],
      },
      isPending: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isError: false,
    } as unknown as ReturnType<typeof useBrandPaymentsSpendingQuery>)

    rerender(
      <QueryClientProvider client={queryClient}>
        <BrandPaymentsPage
          filters={{
            period: '30d',
            q: 'not found',
          }}
          onFiltersChange={vi.fn()}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('is axe-clean for the populated dashboard', async () => {
    const { container } = renderPage(makeResponse())

    expect(await axe(container)).toHaveNoViolations()
  })
})

function makeResponse(options?: {
  totalSpent?: string
  rows?: BrandPaymentsSpendingResponse['payments']['data']
}): BrandPaymentsSpendingResponse {
  const rows = options?.rows ?? [
    {
      id: 'payment-1',
      declared_at: '2026-04-28T12:00:00Z',
      creator: {
        account_id: '22222222-2222-4222-8222-222222222222',
        display_name: 'Lara Pérez',
        handle: '@lara',
      },
      campaign: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Summer Glow Launch',
      },
      deliverable: {
        id: 'deliverable-1',
        label: 'IG Reel · #2',
        platform: 'instagram',
        format: 'reel',
      },
      amount: '4575',
      conversation_id: 'conversation-1',
      highlight: { kind: 'payment', id: 'payment-1' },
    },
  ]

  return {
    brand_workspace_id: 'workspace-1',
    period: {
      value: '30d',
      start_at: '2026-04-09T00:00:00Z',
      end_at: '2026-05-09T00:00:00Z',
    },
    summary: {
      total_spent: options?.totalSpent ?? '184250',
      period_spend: '42820',
      pending_approval: '8430',
      next_debit: {
        amount: '3200',
        date: '2026-05-16T00:00:00Z',
        date_available: true,
        source: 'payment_obligations',
      },
    },
    monthly_spend: [
      { month: '2026-02', amount: '42820' },
      { month: '2026-03', amount: '31800' },
      { month: '2026-04', amount: '27100' },
    ],
    campaign_breakdown: [
      {
        campaign_id: '11111111-1111-4111-8111-111111111111',
        campaign_name: 'Summer Glow Launch',
        amount: '64500',
        percentage: '55',
        bucket: 'campaign',
      },
      {
        campaign_id: null,
        campaign_name: 'Others',
        amount: '10200',
        percentage: '45',
        bucket: 'others',
      },
    ],
    filters: {
      campaigns: [
        {
          campaign_id: '11111111-1111-4111-8111-111111111111',
          campaign_name: 'Summer Glow Launch',
        },
      ],
      creators: [
        {
          creator_account_id: '22222222-2222-4222-8222-222222222222',
          display_name: 'Lara Pérez',
          handle: '@lara',
        },
      ],
    },
    payments: {
      data: rows,
      next_cursor: null,
      total_visible: rows.length,
    },
  }
}
