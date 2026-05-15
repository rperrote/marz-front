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
  type: 'bundle',
  offer: {
    id: 'a1b2c3d4-abcd-1234-abcd-abcdef123456',
    campaign_id: 'campaign-q3-abc',
    brand_workspace_id: 'ws-1',
    creator_account_id: 'creator-1',
    created_by_account_id: 'creator-1',
    type: 'bundle',
    status: 'sent',
    amount: '2800.00',
    bonus_terms: null,
    deadline: null,
    expires_at: '2024-09-21T12:00:00Z',
    description: '',
    deliverable: { platform: 'youtube', format: 'yt_long' },
    created_at: '2024-09-14T12:00:00Z',
    updated_at: '2024-09-14T12:00:00Z',
    sent_at: '2024-09-14T12:00:00Z',
    deliverables: [],
    stages: [],
  },
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
      expect.stringContaining('campaign'),
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
