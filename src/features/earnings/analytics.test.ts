import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Fragment, createElement } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CreatorEarningsPayments,
  CreatorEarningsResponse,
} from '#/shared/api/generated/model'
import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import { EarningsPage } from './components/EarningsPage'
import { EarningsPaymentsTable } from './components/EarningsPaymentsTable'
import { EarningsPeriodControl } from './components/EarningsPeriodControl'
import { PendingBonusCard } from './components/PendingBonusCard'
import type { PendingBonusCardBonus } from './components/PendingBonusCard'

const {
  mockNavigate,
  mockMutate,
  mockUseCreatorEarningsQuery,
  mockUseExportCreatorEarningsMutation,
  mockUseNavigate,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutate: vi.fn(),
  mockUseCreatorEarningsQuery: vi.fn(),
  mockUseExportCreatorEarningsMutation: vi.fn(),
  mockUseNavigate: vi.fn((options?: unknown) => {
    void options
    return vi.fn()
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    onClick,
    to,
  }: {
    children: ReactNode
    onClick?: () => void
    to: string
  }) =>
    createElement(
      'a',
      {
        href: to,
        onClick: (event: ReactMouseEvent<HTMLAnchorElement>) => {
          event.preventDefault()
          onClick?.()
        },
      },
      children,
    ),
  useNavigate: (options?: unknown) => mockUseNavigate(options),
}))

vi.mock('./hooks/useCreatorEarnings', () => ({
  useCreatorEarningsQuery: mockUseCreatorEarningsQuery,
}))

vi.mock('./hooks/useExportCreatorEarnings', () => ({
  useExportCreatorEarningsMutation: mockUseExportCreatorEarningsMutation,
}))

vi.mock('./components/MonthlyEarningsChart', () => ({
  MonthlyEarningsChart: () =>
    createElement('section', { 'aria-label': 'Chart' }),
}))

vi.mock('./components/PendingBonusPanel', () => ({
  PendingBonusPanel: () =>
    createElement('section', { 'aria-label': 'Pending bonuses' }),
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
  Trans: ({ children }: { children: ReactNode }) =>
    createElement(Fragment, null, children),
}))

const earningsResponse: CreatorEarningsResponse = {
  period: '90d',
  generated_at: '2026-05-09T00:00:00.000Z',
  kpis: {
    total_earned: { amount: '48920.00' },
    earned_in_period: { amount: '12450.00' },
    pending_payout: { amount: '3275.00' },
    next_payout: {
      amount: '1840.00',
      estimated_date: '2026-05-12T00:00:00.000Z',
      date_available: true,
    },
  },
  monthly_earnings: [],
  pending_bonuses: {
    items: [],
    next_cursor: null,
    has_more: false,
  },
  payments: {
    items: [],
    next_cursor: null,
    has_more: false,
    total_visible: 0,
  },
  empty_states: {
    no_payments_ever: false,
    no_period_payments: false,
    no_pending_bonuses: true,
  },
}

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
  ],
  next_cursor: null,
  has_more: false,
  total_visible: 1,
}

const speedBonus: PendingBonusCardBonus = {
  id: 'bonus-1',
  type: 'speed',
  offer_id: 'offer-1',
  conversation_id: 'conversation-1',
  campaign_id: 'campaign-1',
  brand_workspace_id: 'brand-workspace-1',
  brand_name: 'Nike',
  brand_logo_url: null,
  campaign_name: 'Spring Drop',
  deliverable_id: 'deliverable-1',
  deliverable_label: 'Reel #2',
  bonus_pct: '20',
  estimated_bonus_amount: '200.00',
  window_hours: 24,
  starts_at: '2026-05-09T12:00:00.000Z',
  expires_at: '2026-05-10T12:00:00.000Z',
  seconds_remaining: 86_400,
  action: {
    label: 'Ver oferta',
    href: '/workspace/conversations/conversation-1?offerId=offer-1',
  },
}

beforeEach(() => {
  resetTrackedEvents()
  mockNavigate.mockReset()
  mockMutate.mockReset()
  mockUseNavigate.mockReset()
  mockUseNavigate.mockReturnValue(mockNavigate)
  mockUseCreatorEarningsQuery.mockReturnValue({
    isLoading: false,
    isError: false,
    data: earningsResponse,
  })
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
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('earnings analytics', () => {
  it('fires earnings_viewed once per page mount', () => {
    const { rerender } = render(
      createElement(EarningsPage, { period: '90d', onPeriodChange: vi.fn() }),
    )

    rerender(
      createElement(EarningsPage, { period: '12m', onPeriodChange: vi.fn() }),
    )

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_viewed',
        payload: undefined,
      }),
    ])
  })

  it('fires earnings_period_changed with previous and next periods', async () => {
    const user = userEvent.setup()

    render(
      createElement(EarningsPeriodControl, {
        value: '30d',
        onChange: vi.fn(),
      }),
    )

    await user.click(screen.getByRole('radio', { name: '90d' }))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_period_changed',
        payload: { from: '30d', to: '90d' },
      }),
    ])
  })

  it('debounces earnings_payment_search_used and sends the searched query', () => {
    vi.useFakeTimers()

    render(
      createElement(EarningsPaymentsTable, {
        period: '90d',
        payments,
      }),
    )

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Buscar pagos por marca o campaña',
      }),
      { target: { value: 'Nubank' } },
    )

    expect(getTrackedEvents()).toHaveLength(0)

    act(() => vi.advanceTimersByTime(299))

    expect(getTrackedEvents()).toHaveLength(0)

    act(() => vi.advanceTimersByTime(1))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_payment_search_used',
        payload: { q: 'Nubank' },
      }),
    ])
  })

  it('fires earnings_csv_exported with active filters and truncated flag', async () => {
    const user = userEvent.setup()

    mockMutate.mockImplementation((_input, options) => {
      options.onSuccess({
        blob: new Blob(['date,status\n'], { type: 'text/csv' }),
        truncated: true,
      })
    })

    render(
      createElement(EarningsPaymentsTable, {
        period: '12m',
        q: 'acme',
        payments,
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_csv_exported',
        payload: {
          period: '12m',
          q: 'acme',
          truncated: true,
          row_count: 1,
        },
      }),
    ])
  })

  it('fires earnings_bonus_opened with bonus identifiers', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'))

    render(createElement(PendingBonusCard, { bonus: speedBonus }))

    fireEvent.click(screen.getByRole('link', { name: /ver oferta/i }))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_bonus_opened',
        payload: {
          bonus_id: 'bonus-1',
          offer_id: 'offer-1',
          conversation_id: 'conversation-1',
        },
      }),
    ])
  })

  it('fires earnings_payment_opened with payment kind and conversation', async () => {
    const user = userEvent.setup()

    render(
      createElement(EarningsPaymentsTable, {
        period: '30d',
        payments,
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: /abrir conversación de acme, summer launch, reel de instagram/i,
      }),
    )

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'earnings_payment_opened',
        payload: {
          payment_kind: 'declared_payment',
          conversation_id: 'conversation-1',
        },
      }),
    ])
  })
})
