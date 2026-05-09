import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { MutationFunctionContext } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { ApiError } from '#/shared/api/mutator'

import type { BrandPaymentsSpendingResponse } from '../api/brandPaymentsSchemas'
import * as paymentsAnalytics from '../analytics'
import { useExportBrandPaymentsCsvMutation } from '../hooks/useExportBrandPaymentsCsvMutation'
import { useBrandPaymentsSpendingQuery } from '../hooks/useBrandPaymentsSpendingQuery'
import { BrandPaymentsPage, getCsvFilename } from './BrandPaymentsPage'

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

vi.mock('../hooks/useExportBrandPaymentsCsvMutation', () => ({
  useExportBrandPaymentsCsvMutation: vi.fn(),
}))

vi.mock('../analytics', () => ({
  trackBrandPaymentsViewed: vi.fn(),
  trackBrandPaymentsPeriodChanged: vi.fn(),
  trackBrandPaymentsFilterChanged: vi.fn(),
  trackBrandPaymentsSearchUsed: vi.fn(),
  trackBrandPaymentsCsvExported: vi.fn(),
  trackBrandPaymentsRefreshClicked: vi.fn(),
  trackBrandPaymentOpened: vi.fn(),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'acct-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockUseBrandPaymentsSpendingQuery = vi.mocked(
  useBrandPaymentsSpendingQuery,
)
const mockUseExportBrandPaymentsCsvMutation = vi.mocked(
  useExportBrandPaymentsCsvMutation,
)
type ExportCsvMutate = ReturnType<
  typeof useExportBrandPaymentsCsvMutation
>['mutate']
const mockMutate = vi.fn<ExportCsvMutate>()

function createMutationFunctionContext(): MutationFunctionContext {
  return {
    client: new QueryClient(),
    meta: undefined,
  }
}

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

  mockUseExportBrandPaymentsCsvMutation.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useExportBrandPaymentsCsvMutation>)

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
    mockWindowDownload()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
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
    expect(
      paymentsAnalytics.trackBrandPaymentsPeriodChanged,
    ).toHaveBeenCalledWith({ period: '90d' })
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

  it('fires viewed and refresh analytics', async () => {
    const user = userEvent.setup()
    renderPage(makeResponse())

    expect(paymentsAnalytics.trackBrandPaymentsViewed).toHaveBeenCalledWith({
      workspace_id: 'workspace-1',
    })

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(
      paymentsAnalytics.trackBrandPaymentsRefreshClicked,
    ).toHaveBeenCalledWith({ workspace_id: 'workspace-1' })
  })

  it('tracks campaign and creator filter changes', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    renderPage(makeResponse(), onFiltersChange)

    await user.click(screen.getByRole('combobox', { name: /campaña/i }))
    await user.click(screen.getByRole('option', { name: 'Summer Glow Launch' }))
    expect(
      paymentsAnalytics.trackBrandPaymentsFilterChanged,
    ).toHaveBeenCalledWith({ filter: 'campaign', has_value: true })

    await user.click(screen.getByRole('combobox', { name: /creator/i }))
    await user.click(screen.getByRole('option', { name: 'Lara Pérez (@lara)' }))
    expect(
      paymentsAnalytics.trackBrandPaymentsFilterChanged,
    ).toHaveBeenCalledWith({ filter: 'creator', has_value: true })
  })

  it('tracks search analytics after debounce instead of each keystroke', async () => {
    vi.useFakeTimers()
    const { rerender } = renderPage(makeResponse())

    const searchInput = screen.getByRole('searchbox', {
      name: 'Buscar pagos',
    })
    fireEvent.change(searchInput, { target: { value: 'ana' } })

    expect(
      paymentsAnalytics.trackBrandPaymentsSearchUsed,
    ).not.toHaveBeenCalled()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    rerender(
      <QueryClientProvider client={queryClient}>
        <BrandPaymentsPage
          filters={{ period: '30d', q: 'ana' }}
          onFiltersChange={vi.fn()}
        />
      </QueryClientProvider>,
    )

    vi.advanceTimersByTime(499)
    expect(
      paymentsAnalytics.trackBrandPaymentsSearchUsed,
    ).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(paymentsAnalytics.trackBrandPaymentsSearchUsed).toHaveBeenCalledWith(
      {
        query_length: 3,
      },
    )
  })

  it('exports CSV using Content-Disposition filename and tracks success', async () => {
    const user = userEvent.setup()
    const response = new Response('id,amount\npayment-1,10\n', {
      status: 200,
      headers: {
        'Content-Disposition':
          'attachment; filename="payments-from-backend.csv"',
      },
    })
    mockMutate.mockImplementation((_variables, options) => {
      void options?.onSuccess?.(
        response,
        { filters: { period: '30d' } },
        undefined,
        createMutationFunctionContext(),
      )
    })
    renderPage(makeResponse())

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
    const link = document.querySelector(
      'a[download="payments-from-backend.csv"]',
    )
    expect(link).not.toBeInTheDocument()
    expect(
      paymentsAnalytics.trackBrandPaymentsCsvExported,
    ).toHaveBeenCalledWith({
      workspace_id: 'workspace-1',
      period: '30d',
      has_campaign_filter: false,
      has_creator_filter: false,
      has_search: false,
    })
  })

  it('falls back to marz filename when Content-Disposition is missing', async () => {
    const clickedDownloads: string[] = []
    mockAnchorClick(clickedDownloads)
    const response = new Response('id,amount\npayment-1,10\n', { status: 200 })
    const fixedDate = new Date('2026-05-09T12:00:00Z')
    const fallbackFilename = getCsvFilename(response, 'workspace-1', fixedDate)
    expect(fallbackFilename).toBe('marz-payments-workspace-1-20260509.csv')
    mockMutate.mockImplementation((_variables, options) => {
      void options?.onSuccess?.(
        response,
        { filters: { period: '30d' } },
        undefined,
        createMutationFunctionContext(),
      )
    })
    renderPage(makeResponse())

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))

    await waitFor(() => {
      expect(clickedDownloads[0]).toMatch(
        /^marz-payments-workspace-1-\d{8}\.csv$/,
      )
    })
  })

  it('shows an export error when the CSV blob cannot be read', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    const response = new Response('id,amount\npayment-1,10\n', { status: 200 })
    vi.spyOn(response, 'blob').mockRejectedValue(new Error('blob failed'))
    mockMutate.mockImplementation((_variables, options) => {
      void options?.onSuccess?.(
        response,
        { filters: { period: '30d' } },
        undefined,
        createMutationFunctionContext(),
      )
    })
    renderPage(makeResponse())

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No pudimos exportar los pagos. Intentá de nuevo.',
      )
    })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(
      paymentsAnalytics.trackBrandPaymentsCsvExported,
    ).not.toHaveBeenCalled()
  })

  it('shows no payments 409 without downloading or tracking export', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    mockMutate.mockImplementation((_variables, options) => {
      options?.onError?.(
        new ApiError(409, 'no_payments_to_export', 'No hay pagos'),
        { filters: { period: '30d' } },
        undefined,
        createMutationFunctionContext(),
      )
    })
    renderPage(makeResponse())

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(toast.info).toHaveBeenCalledWith(
      'No hay pagos para exportar con estos filtros.',
    )
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(
      paymentsAnalytics.trackBrandPaymentsCsvExported,
    ).not.toHaveBeenCalled()
  })

  it('shows export limit 409 copy exactly without downloading or tracking export', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    mockMutate.mockImplementation((_variables, options) => {
      options?.onError?.(
        new ApiError(409, 'export_exceeds_limit', 'Export supera límite'),
        { filters: { period: '30d' } },
        undefined,
        createMutationFunctionContext(),
      )
    })
    renderPage(makeResponse())

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(toast.error).toHaveBeenCalledWith(
      'El export excede el límite. Contactá al administrador (Marz) para obtenerlo manualmente.',
    )
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(
      paymentsAnalytics.trackBrandPaymentsCsvExported,
    ).not.toHaveBeenCalled()
  })
})

function mockWindowDownload() {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:csv'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
  mockAnchorClick()
}

function mockAnchorClick(downloads: string[] = []) {
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download)
  })
}

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
