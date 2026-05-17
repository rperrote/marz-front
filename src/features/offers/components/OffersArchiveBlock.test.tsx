import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OffersArchiveBlock } from './OffersArchiveBlock'
import type { ArchivedOfferDetailItem } from '#/features/offers/hooks/useConversationOffers'
import type { OfferDetailDTO, OfferMode } from '#/features/offers/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeItem(
  id: string,
  offerMode: OfferMode,
  status: OfferDetailDTO['status'],
  amount = '2800.00',
  offerOverrides: Partial<OfferDetailDTO> = {},
): ArchivedOfferDetailItem {
  return {
    offer: {
      id,
      campaign_id: 'campaign-1',
      brand_workspace_id: 'ws-1',
      creator_account_id: 'creator-1',
      created_by_account_id: 'creator-1',
      conversation_id: 'conv-1',
      offer_mode: offerMode,
      status,
      amount,
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
          amount,
        },
      ],
      created_at: '2024-09-14T12:00:00Z',
      updated_at: '2024-09-14T12:00:00Z',
      sent_at: '2024-09-14T12:00:00Z',
      ...offerOverrides,
    },
  }
}

const archiveItems: ArchivedOfferDetailItem[] = [
  makeItem('offer-1-aaaaaaaa', 'per_platform', 'sent'),
  makeItem('offer-2-bbbbbbbb', 'same_content', 'accepted', '3200.00'),
]

describe('OffersArchiveBlock', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(
      <OffersArchiveBlock items={[]} nextCursor={null} actorKind="brand" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('is collapsed by default', () => {
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByText(/\$2,800\.00/)).not.toBeInTheDocument()
  })

  it('expands on click and shows items', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText(/\$2,800\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$3,200\.00/)).toBeInTheDocument()
  })

  it('starts expanded when defaultOpen is true', () => {
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
        defaultOpen
      />,
    )
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    expect(screen.getByText(/\$2,800\.00/)).toBeInTheDocument()
  })

  it('shows pending badge for past sent offers', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Aceptada')).toBeInTheDocument()
  })

  it('differentiates accepted paid and cancelled archive badges', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={[
          makeItem(
            'offer-paid-aaaaaaaa',
            'same_content',
            'accepted',
            '1000.00',
            {
              paid_at: '2026-05-15T12:00:00Z',
            },
          ),
          makeItem(
            'offer-cancel-pre',
            'same_content',
            'cancelled',
            '1000.00',
            {
              cancellation_phase: 'pre_accept',
            },
          ),
          makeItem(
            'offer-cancel-post',
            'same_content',
            'cancelled',
            '1000.00',
            {
              cancellation_phase: 'post_accept',
            },
          ),
          makeItem('offer-rejected', 'same_content', 'rejected'),
          makeItem('offer-expired', 'same_content', 'expired'),
        ]}
        nextCursor={null}
        actorKind="brand"
      />,
    )

    await user.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText(/Pagada/)).toBeInTheDocument()
    expect(screen.getAllByText(/Cancelada tras aceptación/)[0]).toBeDefined()
    expect(screen.getAllByText('Cancelada')[0]).toBeDefined()
    expect(screen.getByText(/Rechazada/)).toBeInTheDocument()
    expect(screen.getByText(/Vencida/)).toBeInTheDocument()
  })

  it('shows load more button when next_cursor exists', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor="cursor-abc"
        onLoadMore={onLoadMore}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    const loadMoreButton = screen.getByRole('button', { name: /cargar más/i })
    expect(loadMoreButton).toBeInTheDocument()
    await user.click(loadMoreButton)
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('does not show load more when next_cursor is null', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(
      screen.queryByRole('button', { name: /cargar más/i }),
    ).not.toBeInTheDocument()
  })

  it('has aria-expanded attribute', () => {
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    const trigger = screen.getByRole('button', { expanded: false })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('is axe-clean when expanded', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
