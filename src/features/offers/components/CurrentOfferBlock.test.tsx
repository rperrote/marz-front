import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { CurrentOfferBlock } from './CurrentOfferBlock'
import type { ConversationOfferDTO } from '#/features/offers/hooks/useConversationOffers'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const baseOffer: ConversationOfferDTO = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  campaign_id: 'campaign-1',
  campaign_name: 'Q4 Campaign',
  brand_workspace_id: 'ws-1',
  creator_account_id: 'creator-1',
  type: 'single',
  status: 'sent',
  total_amount: '4500.00',
  currency: 'USD',
  deadline: '2024-10-12',
  speed_bonus: null,
  sent_at: '2024-09-01T12:00:00Z',
  expires_at: '2024-09-04T12:00:00Z',
  accepted_at: null,
  rejected_at: null,
  deliverables: [
    {
      id: 'del-1',
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '4500.00',
    },
  ],
}

describe('CurrentOfferBlock', () => {
  it('renders empty state when current is null', () => {
    render(<CurrentOfferBlock offer={null} actorKind="brand" />)
    expect(screen.getByText('No active offer')).toBeInTheDocument()
  })

  it('renders offer with sent badge', () => {
    render(<CurrentOfferBlock offer={baseOffer} actorKind="brand" />)
    expect(screen.getByText('Current Offer')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    expect(screen.getByText('Oct 12')).toBeInTheDocument()
  })

  it('renders accepted state with badge', () => {
    const accepted = {
      ...baseOffer,
      status: 'accepted' as const,
      accepted_at: '2024-09-02T12:00:00Z',
    }
    render(<CurrentOfferBlock offer={accepted} actorKind="brand" />)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('renders speed bonus when present', () => {
    const withBonus = {
      ...baseOffer,
      speed_bonus: {
        early_deadline: '2024-10-05',
        bonus_amount: '675.00',
        currency: 'USD',
      },
    }
    render(<CurrentOfferBlock offer={withBonus} actorKind="brand" />)
    expect(screen.getByText('Speed bonus')).toBeInTheDocument()
    expect(screen.getByText('+$675.00')).toBeInTheDocument()
  })

  it('renders platform deliverable', () => {
    render(<CurrentOfferBlock offer={baseOffer} actorKind="brand" />)
    expect(screen.getByText('YouTube Video')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CurrentOfferBlock offer={baseOffer} actorKind="brand" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
