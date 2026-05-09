import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import type { CreatorEarningsResponse } from '#/shared/api/generated/model'
import { EarningsPage } from './EarningsPage'

const { mockUseCreatorEarningsQuery } = vi.hoisted(() => ({
  mockUseCreatorEarningsQuery: vi.fn(),
}))

vi.mock('../hooks/useCreatorEarnings', () => ({
  useCreatorEarningsQuery: mockUseCreatorEarningsQuery,
}))

vi.mock('./EarningsPaymentsTable', () => ({
  EarningsPaymentsTable: () => <section aria-label="Payments table" />,
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
  monthly_earnings: [
    { month: '2026-03', amount: '6400.00' },
    { month: '2026-04', amount: '7200.00' },
  ],
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

describe('EarningsPage', () => {
  it('queries the selected period and renders dashboard summary', () => {
    mockUseCreatorEarningsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: earningsResponse,
    })

    render(
      <EarningsPage
        period="90d"
        q="acme"
        cursor="cursor-1"
        onPeriodChange={vi.fn()}
      />,
    )

    expect(mockUseCreatorEarningsQuery).toHaveBeenCalledWith({
      period: '90d',
      q: 'acme',
      cursor: 'cursor-1',
      limit: 25,
    })
    expect(
      screen.getByRole('heading', { name: 'Earnings' }),
    ).toBeInTheDocument()
    expect(screen.getByText('$48,920')).toBeInTheDocument()
    expect(screen.getByText('$12,450')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /earnings by month/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Bonos que podés alcanzar a tiempo',
      }),
    ).toBeInTheDocument()
  })
})
