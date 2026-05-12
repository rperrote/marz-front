import type { ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { CurrentOfferBlock } from './CurrentOfferBlock'
import type { OfferDTO } from '#/features/offers/hooks/useConversationOffers'
import type {
  DeliverableDTO,
  DeliverableStatus,
} from '#/features/deliverables/types'

function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const base = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  campaign_id: 'campaign-1',
  brand_workspace_id: 'ws-1',
  creator_account_id: 'creator-1',
  created_by_account_id: 'creator-1',
  status: 'sent',
  amount: '4500.00',
  deadline: '2024-10-12',
  bonus_terms: null,
  expires_at: '2024-09-04T12:00:00Z',
  description: '',
  deliverable: { platform: 'youtube', format: 'yt_long' },
  created_at: '2024-09-01T12:00:00Z',
  updated_at: '2024-09-01T12:00:00Z',
  sent_at: '2024-09-01T12:00:00Z',
} as const

const singleOffer: OfferDTO = {
  ...base,
  type: 'single',
  deliverables: [
    {
      position: 1,
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '4500.00',
    },
  ],
  stages: [],
}

const bundleOffer: OfferDTO = {
  ...base,
  type: 'bundle',
  deliverables: [
    {
      position: 1,
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '2000.00',
    },
    {
      position: 2,
      platform: 'instagram',
      format: 'ig_reel',
      quantity: 2,
      amount: '2500.00',
    },
  ],
  stages: [],
}

const multistageOffer: OfferDTO = {
  ...base,
  type: 'multistage',
  deliverables: [],
  stages: [
    {
      position: 1,
      name: 'Concept',
      description: 'Mood board and concept.',
      deadline: '2024-05-01',
      amount: '1500.00',
      status: 'locked',
    },
    {
      position: 2,
      name: 'Production',
      description: 'Film and edit.',
      deadline: '2024-06-01',
      amount: '3000.00',
      status: 'open',
    },
  ],
}

function makeDeliverables(statuses: DeliverableStatus[]): DeliverableDTO[] {
  return statuses.map((status, i) => ({
    id: `del-${i}`,
    offer_id: 'offer-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'yt_long',
    status,
    deadline: null,
    current_version: null,
    current_draft: null,
    drafts_count: 0,
    change_requests_count: 0,
    drafts: [],
    latest_change_request: null,
    change_requests: [],
    created_at: '2024-09-01T12:00:00Z',
    updated_at: '2024-09-01T12:00:00Z',
  }))
}

const defaultProps = {
  actorKind: 'brand' as const,
  deliverables: [] as DeliverableDTO[],
  stages: [],
  sessionKind: 'brand' as const,
  onUploadDraft: () => {},
}

describe('CurrentOfferBlock', () => {
  it('renders empty state when current is null', () => {
    render(<CurrentOfferBlock offer={null} {...defaultProps} />)
    expect(screen.getByText('No active offer')).toBeInTheDocument()
  })

  it('renders Send Offer button in empty state when brand can send', () => {
    render(
      <CurrentOfferBlock
        offer={null}
        {...defaultProps}
        canSendOffer={{ visible: true, disabled: false }}
        onSendOffer={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Send Offer' }),
    ).toBeInTheDocument()
  })

  it('does not render Send Offer button when canSendOffer is not visible', () => {
    render(
      <CurrentOfferBlock
        offer={null}
        {...defaultProps}
        canSendOffer={{ visible: false, disabled: false }}
        onSendOffer={() => {}}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Send Offer' }),
    ).not.toBeInTheDocument()
  })

  it('renders offer with sent badge', () => {
    render(<CurrentOfferBlock offer={singleOffer} {...defaultProps} />)
    expect(screen.getByText('Current Offer')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    expect(screen.getByText('Oct 12')).toBeInTheDocument()
  })

  it('renders accepted state with badge', () => {
    const accepted: OfferDTO = { ...singleOffer, status: 'accepted' }
    render(<CurrentOfferBlock offer={accepted} {...defaultProps} />)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('renders speed bonus windows when present', () => {
    const withBonus: OfferDTO = {
      ...singleOffer,
      bonus_terms: {
        speed_bonus_windows: [{ window_hours: 24, bonus_pct: '15' }],
      },
    }
    render(<CurrentOfferBlock offer={withBonus} {...defaultProps} />)
    expect(screen.getByText('Speed bonus')).toBeInTheDocument()
    expect(screen.getByText('+15% / 24h')).toBeInTheDocument()
  })

  it('rendersMultiStage', () => {
    render(<CurrentOfferBlock offer={multistageOffer} {...defaultProps} />)
    expect(screen.getByText('Concept')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
  })

  it.each([
    ['single', singleOffer, ['paid'], 'Fully paid'],
    ['bundle', bundleOffer, ['paid', 'completed'], 'Partially paid (1/2)'],
    ['bundle', bundleOffer, ['paid', 'paid'], 'Fully paid'],
  ])(
    'renders payment progress label for %s offers',
    (_type, offer, statuses, expectedLabel) => {
      renderWithQuery(
        <CurrentOfferBlock
          offer={offer}
          {...defaultProps}
          deliverables={makeDeliverables(statuses as DeliverableStatus[])}
        />,
      )
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    },
  )

  it('is axe-clean', async () => {
    const { container } = render(
      <CurrentOfferBlock offer={singleOffer} {...defaultProps} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
