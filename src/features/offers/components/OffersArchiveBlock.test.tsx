import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OffersArchiveBlock } from './OffersArchiveBlock'
import type { ArchivedOfferDetailItem } from '#/features/offers/hooks/useConversationOffers'
import type { OfferDetailDTO } from '#/features/offers/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeItem(
  id: string,
  type: ArchivedOfferDetailItem['type'],
  status: OfferDetailDTO['status'],
  amount = '2800.00',
  offerOverrides: Partial<OfferDetailDTO> = {},
): ArchivedOfferDetailItem {
  return {
    type,
    offer: {
      id,
      campaign_id: 'campaign-1',
      brand_workspace_id: 'ws-1',
      creator_account_id: 'creator-1',
      created_by_account_id: 'creator-1',
      type,
      status,
      amount,
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
      ...offerOverrides,
    },
  }
}

const archiveItems: ArchivedOfferDetailItem[] = [
  makeItem('offer-1-aaaaaaaa', 'bundle', 'sent'),
  makeItem('offer-2-bbbbbbbb', 'multistage', 'accepted', '3200.00'),
]

describe('OffersArchiveBlock', () => {
  it('renders empty state when no items', () => {
    render(
      <OffersArchiveBlock items={[]} nextCursor={null} actorKind="brand" />,
    )
    expect(screen.getByText('Sin ofertas anteriores')).toBeInTheDocument()
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
    expect(screen.queryByText('#offer-1-')).not.toBeInTheDocument()
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
    expect(screen.getByText('#offer-1-')).toBeInTheDocument()
    expect(screen.getByText('#offer-2-')).toBeInTheDocument()
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
          makeItem('offer-paid-aaaaaaaa', 'single', 'accepted', '1000.00', {
            paid_at: '2026-05-15T12:00:00Z',
          }),
          makeItem('offer-cancel-pre', 'single', 'cancelled', '1000.00', {
            cancellation_phase: 'pre',
          }),
          makeItem('offer-cancel-post', 'single', 'cancelled', '1000.00', {
            cancellation_phase: 'post',
          }),
          makeItem('offer-rejected', 'single', 'rejected'),
          makeItem('offer-expired', 'single', 'expired'),
        ]}
        nextCursor={null}
        actorKind="brand"
      />,
    )

    await user.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText('Aceptada (pagada)')).toBeInTheDocument()
    expect(screen.getByText('Cancelada (pre)')).toBeInTheDocument()
    expect(screen.getByText('Cancelada (post)')).toBeInTheDocument()
    expect(screen.getByText('Rechazada')).toBeInTheDocument()
    expect(screen.getByText('Expirada')).toBeInTheDocument()
  })

  it('rendersTypeBadge', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={archiveItems}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('Bundle')).toBeInTheDocument()
    expect(screen.getByText('Multi-stage')).toBeInTheDocument()
  })

  it('coexistingPendingOffersOfDifferentTypes', async () => {
    const user = userEvent.setup()
    render(
      <OffersArchiveBlock
        items={[
          makeItem('offer-bundle-aaaaaaaa', 'bundle', 'sent'),
          makeItem('offer-single-bbbbbbbb', 'single', 'sent'),
        ]}
        nextCursor={null}
        actorKind="brand"
      />,
    )
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getAllByText('Pendiente')).toHaveLength(2)
    expect(screen.getByText('Bundle')).toBeInTheDocument()
    expect(screen.getByText('Single')).toBeInTheDocument()
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
