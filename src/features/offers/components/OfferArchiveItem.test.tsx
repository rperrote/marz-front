import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferArchiveItem } from './OfferArchiveItem'
import type { ArchiveOfferItem } from '#/features/offers/hooks/useConversationOffers'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const sentItem: ArchiveOfferItem = {
  id: 'a1b2c3d4-abcd-1234-abcd-abcdef123456',
  type: 'bundle',
  status: 'sent',
  total_amount: '2800.00',
  currency: 'USD',
  sent_at: '2024-09-14T12:00:00Z',
  campaign_name: 'Q3 Campaign',
}

describe('OfferArchiveItem', () => {
  it('renders item id and amount', () => {
    render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    expect(screen.getByText('#a1b2c3d4')).toBeInTheDocument()
    expect(screen.getByText(/\$2,800\.00/)).toBeInTheDocument()
  })

  it('shows Pending badge for sent status', () => {
    render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows Accepted badge for accepted status', () => {
    const accepted = { ...sentItem, status: 'accepted' as const }
    render(
      <ul>
        <OfferArchiveItem item={accepted} />
      </ul>,
    )
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('has descriptive aria-label', () => {
    render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Q3 Campaign'),
    )
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
