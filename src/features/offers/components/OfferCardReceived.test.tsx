import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OfferCardReceived } from './OfferCardReceived'
import type { OfferSnapshot, OfferStatus } from '../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/hooks/useNow', () => ({
  useNow: () => new Date('2026-04-26T12:00:00Z'),
}))

vi.mock('../analytics', () => ({
  trackOfferEvent: vi.fn(),
  markOfferSeen: vi.fn(() => true),
}))

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
    })),
  )
})

const baseSnapshot: OfferSnapshot = {
  offer_id: 'offer-1',
  campaign_id: 'camp-1',
  campaign_name: 'Q4 Echo Wireless Series',
  type: 'single',
  platform: 'youtube',
  format: 'yt_long',
  total_amount: '4500.00',
  currency: 'USD',
  deadline: '2026-10-12',
  speed_bonus: null,
  sent_at: '2026-04-25T10:00:00Z',
  expires_at: '2026-04-28T10:00:00Z',
}

const expiredSnapshot: OfferSnapshot = {
  ...baseSnapshot,
  expires_at: '2026-04-25T10:00:00Z',
}

const statuses: OfferStatus[] = ['sent', 'accepted', 'rejected', 'expired']

describe('OfferCardReceived', () => {
  const onAccept = vi.fn()
  const onReject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(statuses)('renders with status "%s"', (status) => {
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status={status}
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
  })

  it('shows accept/reject buttons when status is sent and not expired', () => {
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.getByRole('button', { name: /accept offer/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('actions disabled when status is not sent', () => {
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="accepted"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
  })

  it('actions disabled when expired', () => {
    render(
      <OfferCardReceived
        snapshot={expiredSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onAccept when Accept is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    await user.click(screen.getByRole('button', { name: /accept offer/i }))
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('calls onReject when Reject is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('disables buttons while accepting', () => {
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
        isAccepting
      />,
    )
    expect(screen.getByRole('button', { name: /accepting/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled()
  })

  it('has role="article" with descriptive aria-label', () => {
    render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label')
    expect(article.getAttribute('aria-label')).toContain('$4,500.00')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OfferCardReceived
        snapshot={baseSnapshot}
        status="sent"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
