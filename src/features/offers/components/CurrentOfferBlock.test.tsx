import type { ReactElement } from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
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
  conversation_id: 'conv-1',
  status: 'sent' as const,
  amount: '4500.00',
  currency: 'USD',
  tentative_publish_date: '2024-10-10',
  offer_deadline: '2024-10-12',
  bonus_terms: null,
  expires_at: '2024-09-04T12:00:00Z',
  description: '',
  platforms: ['youtube'],
  created_at: '2024-09-01T12:00:00Z',
  updated_at: '2024-09-01T12:00:00Z',
  sent_at: '2024-09-01T12:00:00Z',
}

const sameContentOffer: OfferDTO = {
  ...base,
  offer_mode: 'same_content',
  deliverables: [
    {
      position: 1,
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: '4500.00',
    },
  ],
}

const perPlatformOffer: OfferDTO = {
  ...base,
  offer_mode: 'per_platform',
  platforms: ['youtube', 'instagram'],
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
    latest_change_request: null,
    change_requests: [],
    created_at: '2024-09-01T12:00:00Z',
    updated_at: '2024-09-01T12:00:00Z',
  }))
}

const defaultProps = {
  actorKind: 'brand' as const,
  deliverables: [] as DeliverableDTO[],
  sessionKind: 'brand' as const,
  onUploadDraft: () => {},
}

describe('CurrentOfferBlock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders empty state when current is null', () => {
    renderWithQuery(<CurrentOfferBlock offer={null} {...defaultProps} />)
    expect(screen.getByText('Sin oferta activa')).toBeInTheDocument()
  })

  it('renders Enviar oferta button in empty state when brand can send', () => {
    renderWithQuery(
      <CurrentOfferBlock
        offer={null}
        {...defaultProps}
        canSendOffer={{ visible: true, disabled: false }}
        onSendOffer={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Enviar oferta' }),
    ).toBeInTheDocument()
  })

  it('does not render Enviar oferta button when canSendOffer is not visible', () => {
    renderWithQuery(
      <CurrentOfferBlock
        offer={null}
        {...defaultProps}
        canSendOffer={{ visible: false, disabled: false }}
        onSendOffer={() => {}}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Enviar oferta' }),
    ).not.toBeInTheDocument()
  })

  it('renders same_content offer with sent badge', () => {
    renderWithQuery(
      <CurrentOfferBlock offer={sameContentOffer} {...defaultProps} />,
    )
    expect(screen.getByText('Oferta actual')).toBeInTheDocument()
    expect(screen.getAllByText('Enviada')).not.toHaveLength(0)
    expect(screen.getByText('Mismo contenido')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
  })

  it('renders per_platform offer fields', () => {
    renderWithQuery(
      <CurrentOfferBlock offer={perPlatformOffer} {...defaultProps} />,
    )

    expect(screen.getByText('Por plataforma')).toBeInTheDocument()
    expect(screen.getByText('Publicación tentativa')).toBeInTheDocument()
    expect(screen.getByText('Fecha límite')).toBeInTheDocument()
    expect(screen.getByText('YouTube, Instagram')).toBeInTheDocument()
  })

  it('renders accepted state with badge', () => {
    const accepted: OfferDTO = { ...sameContentOffer, status: 'accepted' }
    renderWithQuery(<CurrentOfferBlock offer={accepted} {...defaultProps} />)
    expect(screen.getAllByText('Aceptada')).not.toHaveLength(0)
  })

  it('renders creator sent actions with countdown', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-09-04T11:59:58.000Z'))

    renderWithQuery(
      <CurrentOfferBlock
        offer={sameContentOffer}
        {...defaultProps}
        actorKind="creator"
        sessionKind="creator"
        conversationId="conv-1"
      />,
    )

    expect(screen.getByText('0m 02s restantes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
  })

  it('renders speed bonus windows when present', () => {
    const withBonus: OfferDTO = {
      ...sameContentOffer,
      bonus_terms: {
        speed_bonus_windows: [{ window_hours: 24, bonus_pct: '15' }],
      },
    }
    renderWithQuery(<CurrentOfferBlock offer={withBonus} {...defaultProps} />)
    expect(screen.getByText('Bonus por rapidez')).toBeInTheDocument()
    expect(screen.getByText('+15% / 24h')).toBeInTheDocument()
  })

  it.each([
    ['same_content', sameContentOffer, ['paid'], 'Pagada en total'],
    [
      'per_platform',
      perPlatformOffer,
      ['paid', 'completed'],
      'Pago parcial (1/2)',
    ],
    ['per_platform', perPlatformOffer, ['paid', 'paid'], 'Pagada en total'],
  ])(
    'renders payment progress label for %s offers',
    (_mode, offer, statuses, expectedLabel) => {
      renderWithQuery(
        <CurrentOfferBlock
          offer={offer}
          {...defaultProps}
          deliverables={makeDeliverables(statuses as DeliverableStatus[])}
        />,
      )
      expect(screen.getAllByText(expectedLabel)).not.toHaveLength(0)
    },
  )

  it('is axe-clean', async () => {
    const { container } = renderWithQuery(
      <CurrentOfferBlock offer={sameContentOffer} {...defaultProps} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
