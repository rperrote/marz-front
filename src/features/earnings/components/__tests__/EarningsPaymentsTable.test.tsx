import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import type { CreatorEarningsPayments } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { EarningsPaymentsTable } from '../EarningsPaymentsTable'

const {
  mockNavigate,
  mockMutate,
  mockUseExportCreatorEarningsMutation,
  mockUseNavigate,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutate: vi.fn(),
  mockUseExportCreatorEarningsMutation: vi.fn(),
  mockUseNavigate: vi.fn((options?: unknown) => {
    void options
    return vi.fn()
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: (options?: unknown) => mockUseNavigate(options),
}))

vi.mock('../../hooks/useExportCreatorEarnings', () => ({
  useExportCreatorEarningsMutation: mockUseExportCreatorEarningsMutation,
}))

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

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}))

const payments: CreatorEarningsPayments = {
  items: [
    {
      id: 'payment-1',
      kind: 'declared_payment',
      status: 'paid',
      visible_status_label: 'Pagado',
      occurred_at: '2026-05-08T12:00:00.000Z',
      brand_workspace_id: 'brand-workspace-1',
      brand_name: 'Acme',
      brand_logo_url: null,
      campaign_id: 'campaign-1',
      campaign_name: 'Summer launch',
      offer_id: 'offer-1',
      deliverable_id: 'deliverable-1',
      conversation_id: 'conversation-1',
      deliverable_label: 'Reel de Instagram',
      amount: '1200.00',
      href: '/workspace/conversations/conversation-1?paymentId=payment-1',
    },
    {
      id: 'obligation-1',
      kind: 'payment_obligation',
      status: 'pending',
      visible_status_label: 'Por cobrar',
      occurred_at: '2026-05-07T12:00:00.000Z',
      brand_workspace_id: 'brand-workspace-2',
      brand_name: 'Nubank',
      brand_logo_url: null,
      campaign_id: 'campaign-2',
      campaign_name: 'Card launch',
      offer_id: 'offer-2',
      deliverable_id: 'deliverable-2',
      conversation_id: 'conversation-2',
      deliverable_label: 'Historia',
      amount: '800.00',
      href: '/workspace/conversations/conversation-2?deliverableId=deliverable-2',
    },
  ],
  next_cursor: 'next-cursor',
  has_more: true,
  total_visible: 2,
}

const TRUNCATED_EXPORT_MESSAGE =
  'Se exportaron las 10k filas más recientes. Para el export completo, contactá al administrador (Marz)'

describe('EarningsPaymentsTable', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockMutate.mockReset()
    mockUseNavigate.mockReset()
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockUseExportCreatorEarningsMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:earnings-csv'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders payment rows and navigates to the exact row href', async () => {
    const user = userEvent.setup()

    render(<EarningsPaymentsTable period="30d" payments={payments} />)

    expect(screen.getAllByText('Acme')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Summer launch')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Reel de Instagram')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Pagado')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Por cobrar')[0]).toBeInTheDocument()

    await user.click(
      screen.getAllByRole('button', {
        name: /abrir conversación de acme, summer launch, reel de instagram/i,
      })[0]!,
    )

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/workspace/conversations/conversation-1?paymentId=payment-1',
      search: expect.any(Function),
    })
  })

  it('updates the q URL search param after the debounce and clears cursor', async () => {
    const user = userEvent.setup()

    render(<EarningsPaymentsTable period="90d" payments={payments} />)

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Buscar pagos por marca o campaña',
      }),
      'Nubank',
    )

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())

    const navigateCall = mockNavigate.mock.calls.at(-1)?.[0]
    expect(navigateCall).toMatchObject({ replace: true })
    expect(navigateCall.search({ period: '90d', cursor: 'old' })).toEqual({
      period: '90d',
      q: 'Nubank',
      cursor: undefined,
    })
  })

  it('downloads the CSV with the expected filename on export success', async () => {
    const user = userEvent.setup()
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toMatch(/^marz-earnings-12m-\d{8}\.csv$/)
      })

    mockMutate.mockImplementation((_input, options) => {
      options.onSuccess({
        blob: new Blob(['date,status\n'], { type: 'text/csv' }),
        truncated: false,
      })
    })

    render(<EarningsPaymentsTable period="12m" q="acme" payments={payments} />)

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(mockMutate).toHaveBeenCalledWith(
      { period: '12m', q: 'acme' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    expect(clickSpy).toHaveBeenCalled()
    expect(document.querySelector('a')).not.toBeInTheDocument()
  })

  it('shows a clear message for 409 no_payments_to_export', async () => {
    const user = userEvent.setup()

    mockMutate.mockImplementation((_input, options) => {
      options.onError(
        new ApiError(409, 'no_payments_to_export', 'No payments to export'),
      )
    })

    render(<EarningsPaymentsTable period="all" payments={payments} />)

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No hay pagos para exportar con los filtros actuales.',
    )
  })

  it('renders the truncated export banner when export response is truncated', async () => {
    const user = userEvent.setup()

    mockMutate.mockImplementation((_input, options) => {
      options.onSuccess({
        blob: new Blob(['date,status\n'], { type: 'text/csv' }),
        truncated: true,
      })
    })

    render(<EarningsPaymentsTable period="30d" payments={payments} />)

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      TRUNCATED_EXPORT_MESSAGE,
    )
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <EarningsPaymentsTable period="30d" payments={payments} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
