import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { MonthlyEarningsChart } from './MonthlyEarningsChart'

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

describe('MonthlyEarningsChart', () => {
  it('renders an accessible empty state when there are no positive buckets', async () => {
    const { container } = render(
      <MonthlyEarningsChart
        buckets={[
          { month: '2026-01', amount: '0.00' },
          { month: '2026-02', amount: '0.00' },
        ]}
      />,
    )

    expect(
      screen.getByText(/no earnings yet for this period/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('exposes a chart summary and bucket values to assistive tech', () => {
    render(
      <MonthlyEarningsChart
        buckets={[
          { month: '2026-01', amount: '1200.00' },
          { month: '2026-02', amount: '2500.00' },
        ]}
      />,
    )

    expect(
      screen.getByRole('img', { name: /earnings by month/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Jan')).toHaveLength(2)
    expect(screen.getByText('$1,200')).toBeInTheDocument()
    expect(screen.getByText('$2,500')).toBeInTheDocument()
  })
})
