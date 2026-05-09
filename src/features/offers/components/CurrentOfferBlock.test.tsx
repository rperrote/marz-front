import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { CurrentOfferBlock } from './CurrentOfferBlock'
import type {
  ConversationOfferBaseDTO,
  ConversationOfferDTO,
  ConversationOfferSingleDTO,
  ConversationOfferBundleDTO,
  ConversationOfferMultiStageDTO,
  ConversationOfferDeliverableDTO,
} from '#/features/offers/hooks/useConversationOffers'
import type { DeliverableStatus } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const base: ConversationOfferBaseDTO = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  campaign_id: 'campaign-1',
  campaign_name: 'Q4 Campaign',
  brand_workspace_id: 'ws-1',
  creator_account_id: 'creator-1',
  status: 'sent',
  total_amount: '4500.00',
  currency: 'USD',
  deadline: '2024-10-12',
  bonus_terms: null,
  sent_at: '2024-09-01T12:00:00Z',
  expires_at: '2024-09-04T12:00:00Z',
  accepted_at: null,
  rejected_at: null,
}

const singleOffer: ConversationOfferSingleDTO = {
  ...base,
  type: 'single',
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

const bundleOffer: ConversationOfferBundleDTO = {
  ...base,
  type: 'bundle',
  deliverables: [
    {
      id: 'del-1',
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '2000.00',
    },
    {
      id: 'del-2',
      platform: 'instagram',
      format: 'ig_reel',
      quantity: 2,
      amount: '2500.00',
    },
  ],
}

const multistageOffer: ConversationOfferMultiStageDTO = {
  ...base,
  type: 'multistage',
  deliverables: [
    {
      id: 'del-1',
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '1500.00',
    },
    {
      id: 'del-2',
      platform: 'instagram',
      format: 'ig_reel',
      quantity: 1,
      amount: '3000.00',
    },
  ],
  stages: [
    {
      name: 'Concept',
      description: 'Mood board and concept.',
      deadline: '2024-05-01',
      amount: '1500.00',
      status: 'locked',
    },
    {
      name: 'Production',
      description: 'Film and edit.',
      deadline: '2024-06-01',
      amount: '3000.00',
      status: 'open',
    },
  ],
}

function withDeliverableStatuses<T extends ConversationOfferDTO>(
  offer: T,
  statuses: DeliverableStatus[],
): T {
  const deliverables: ConversationOfferDeliverableDTO[] = offer.deliverables

  return {
    ...offer,
    deliverables: deliverables.map((deliverable, index) => ({
      ...deliverable,
      status: statuses[index] ?? deliverable.status,
    })),
  }
}

describe('CurrentOfferBlock', () => {
  it('renders empty state when current is null', () => {
    render(<CurrentOfferBlock offer={null} actorKind="brand" />)
    expect(screen.getByText('No active offer')).toBeInTheDocument()
  })

  it('renders offer with sent badge', () => {
    render(<CurrentOfferBlock offer={singleOffer} actorKind="brand" />)
    expect(screen.getByText('Current Offer')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    expect(screen.getByText('Oct 12')).toBeInTheDocument()
  })

  it('renders accepted state with badge', () => {
    const accepted = {
      ...singleOffer,
      status: 'accepted' as const,
      accepted_at: '2024-09-02T12:00:00Z',
    }
    render(<CurrentOfferBlock offer={accepted} actorKind="brand" />)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('renders speed bonus windows when present', () => {
    const withBonus = {
      ...singleOffer,
      bonus_terms: {
        speed_bonus_windows: [{ window_hours: 24, bonus_pct: '15' }],
      },
    }
    render(<CurrentOfferBlock offer={withBonus} actorKind="brand" />)
    expect(screen.getByText('Speed bonus')).toBeInTheDocument()
    expect(screen.getByText('+15% / 24h')).toBeInTheDocument()
  })

  it('renders platform deliverable', () => {
    render(<CurrentOfferBlock offer={singleOffer} actorKind="brand" />)
    expect(screen.getByText('YouTube Video')).toBeInTheDocument()
  })

  it('rendersBundle', () => {
    render(<CurrentOfferBlock offer={bundleOffer} actorKind="brand" />)
    expect(screen.getByText('YouTube Video × 1')).toBeInTheDocument()
    expect(screen.getByText('Instagram Reel × 2')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getAllByText('$4,500.00').length).toBeGreaterThanOrEqual(2)
  })

  it('rendersMultiStage', () => {
    render(<CurrentOfferBlock offer={multistageOffer} actorKind="brand" />)
    expect(screen.getByText('Concept')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it.each([
    ['single', singleOffer, ['completed'], 'Sent'],
    ['single', singleOffer, ['paid'], 'Fully paid'],
    ['bundle', bundleOffer, ['paid', 'completed'], 'Partially paid (1/2)'],
    ['bundle', bundleOffer, ['paid', 'paid'], 'Fully paid'],
    ['multistage', multistageOffer, ['completed', 'completed'], 'Sent'],
    [
      'multistage',
      multistageOffer,
      ['paid', 'completed'],
      'Partially paid (1/2)',
    ],
    ['multistage', multistageOffer, ['paid', 'paid'], 'Fully paid'],
  ])(
    'renders payment progress label for %s offers',
    (_type, offer, statuses, expectedLabel) => {
      render(
        <CurrentOfferBlock
          offer={withDeliverableStatuses(
            offer,
            statuses as DeliverableStatus[],
          )}
          actorKind="brand"
        />,
      )

      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    },
  )

  it('renders Partially paid (1/3) when one of three deliverables is paid', () => {
    const threeDeliverables: ConversationOfferBundleDTO = {
      ...bundleOffer,
      deliverables: [
        ...bundleOffer.deliverables,
        {
          id: 'del-3',
          platform: 'tiktok',
          format: 'tt_video',
          quantity: 1,
          amount: '500.00',
        },
      ],
    }

    render(
      <CurrentOfferBlock
        offer={withDeliverableStatuses(threeDeliverables, [
          'paid',
          'completed',
          'completed',
        ])}
        actorKind="brand"
      />,
    )

    expect(screen.getByText('Partially paid (1/3)')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CurrentOfferBlock offer={singleOffer} actorKind="brand" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
