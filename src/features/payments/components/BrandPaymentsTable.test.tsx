import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { BrandPaymentHistoryRow } from '../api/brandPaymentsSchemas'
import { BrandPaymentsTable } from './BrandPaymentsTable'

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

describe('BrandPaymentsTable', () => {
  it('renders USD rows and supports keyset load more', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()

    render(
      <BrandPaymentsTable
        rows={[makeRow()]}
        nextCursor="cursor-2"
        loadingMore={false}
        onLoadMore={onLoadMore}
      />,
    )

    expect(screen.getByText('$4,575.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cargar más' }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('opens a payment row from keyboard', async () => {
    const user = userEvent.setup()
    const onOpenPayment = vi.fn()

    render(
      <BrandPaymentsTable
        rows={[makeRow()]}
        nextCursor={null}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onOpenPayment={onOpenPayment}
      />,
    )

    screen.getByRole('row', { name: /lara pérez/i }).focus()
    await user.keyboard('{Enter}')

    expect(onOpenPayment).toHaveBeenCalledWith(makeRow())
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <BrandPaymentsTable
        rows={[makeRow()]}
        nextCursor={null}
        loadingMore={false}
        onLoadMore={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

function makeRow(): BrandPaymentHistoryRow {
  return {
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
  }
}
