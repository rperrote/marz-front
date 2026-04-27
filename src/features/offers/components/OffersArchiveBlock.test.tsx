import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OffersArchiveBlock } from './OffersArchiveBlock'
import type { ArchiveOfferItem } from '#/features/offers/hooks/useConversationOffers'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const archiveItems: ArchiveOfferItem[] = [
  {
    id: 'offer-1',
    status: 'sent',
    total_amount: '2800.00',
    currency: 'USD',
    sent_at: '2024-09-14T12:00:00Z',
    campaign_name: 'Q3 Campaign',
  },
  {
    id: 'offer-2',
    status: 'accepted',
    total_amount: '3200.00',
    currency: 'USD',
    sent_at: '2024-07-02T12:00:00Z',
    campaign_name: 'Q2 Campaign',
  },
]

describe('OffersArchiveBlock', () => {
  it('renders empty state when no items', () => {
    render(
      <OffersArchiveBlock items={[]} nextCursor={null} actorKind="brand" />,
    )
    expect(screen.getByText('No past offers')).toBeInTheDocument()
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
    expect(screen.queryByText('#offer-1')).not.toBeInTheDocument()
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
    expect(screen.getByText('#offer-1')).toBeInTheDocument()
    expect(screen.getByText('#offer-2')).toBeInTheDocument()
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
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
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
    const loadMoreButton = screen.getByRole('button', { name: /load more/i })
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
      screen.queryByRole('button', { name: /load more/i }),
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
