import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferArchiveItem } from './OfferArchiveItem'
import type { ArchivedOfferItem } from '#/features/offers/hooks/useConversationOffers'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const sentItem: ArchivedOfferItem = {
  offer: {
    id: 'a1b2c3d4-abcd-1234-abcd-abcdef123456',
    campaign_id: 'campaign-q3-abc',
    brand_workspace_id: 'ws-1',
    creator_account_id: 'creator-1',
    created_by_account_id: 'creator-1',
    conversation_id: 'conv-1',
    offer_mode: 'per_platform',
    status: 'sent',
    amount: '2800.00',
    currency: 'USD',
    bonus_terms: null,
    tentative_publish_date: '2024-09-19',
    offer_deadline: '2024-09-21',
    expires_at: '2024-09-21T12:00:00Z',
    description: '',
    platforms: ['youtube'],
    deliverables: [
      {
        position: 1,
        platform: 'youtube',
        format: 'yt_long',
        quantity: 1,
        amount: '2800.00',
      },
    ],
    created_at: '2024-09-14T12:00:00Z',
    updated_at: '2024-09-14T12:00:00Z',
    sent_at: '2024-09-14T12:00:00Z',
  },
}

describe('OfferArchiveItem', () => {
  it('renders amount and badge', () => {
    render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    expect(screen.getByText(/\$2,800\.00/)).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('shows Pending badge for sent status', () => {
    render(
      <ul>
        <OfferArchiveItem item={sentItem} />
      </ul>,
    )
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('shows Accepted badge for accepted status', () => {
    const accepted: ArchivedOfferItem = {
      ...sentItem,
      offer: { ...sentItem.offer, status: 'accepted' },
    }
    render(
      <ul>
        <OfferArchiveItem item={accepted} />
      </ul>,
    )
    expect(screen.getByText('Aceptada')).toBeInTheDocument()
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
      expect.stringContaining('$2,800.00'),
    )
    expect(button).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Pendiente'),
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
