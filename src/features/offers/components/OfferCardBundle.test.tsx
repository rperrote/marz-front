import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OfferCardBundle } from './OfferCardBundle'
import type { OfferSnapshotBundle, OfferStatus } from '../types'

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

const baseSnapshot: OfferSnapshotBundle = {
  offer_id: 'offer-bundle-1',
  campaign_id: 'camp-1',
  campaign_name: 'Q4 Echo Wireless Series',
  type: 'bundle',
  total_amount: '4500.00',
  currency: 'USD',
  deadline: '2026-10-12',
  speed_bonus: null,
  sent_at: '2026-04-25T10:00:00Z',
  expires_at: '2026-04-28T10:00:00Z',
  deliverables: [
    { platform: 'youtube', format: 'yt_long', quantity: 2, amount: '2000.00' },
    {
      platform: 'instagram',
      format: 'ig_reel',
      quantity: 1,
      amount: '2500.00',
    },
  ],
}

const expiredSnapshot: OfferSnapshotBundle = {
  ...baseSnapshot,
  expires_at: '2026-04-25T10:00:00Z',
}

const statuses: OfferStatus[] = ['sent', 'accepted', 'rejected', 'expired']

describe('OfferCardBundle', () => {
  const onAccept = vi.fn()
  const onReject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(statuses)(
    'rendersAllFourStatuses_outAndIn for status "%s"',
    (status) => {
      const { rerender } = render(
        <OfferCardBundle
          snapshot={baseSnapshot}
          status={status}
          side="out"
          onAccept={onAccept}
          onReject={onReject}
        />,
      )
      expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
      expect(screen.getByText('$4,500.00')).toBeInTheDocument()

      rerender(
        <OfferCardBundle
          snapshot={baseSnapshot}
          status={status}
          side="in"
          onAccept={onAccept}
          onReject={onReject}
        />,
      )
      expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
      expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    },
  )

  it('actionsDisabledWhenExpired', () => {
    render(
      <OfferCardBundle
        snapshot={expiredSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /reject/i }),
    ).not.toBeInTheDocument()
  })

  it('renders speed bonus when present', () => {
    const snapshotWithBonus: OfferSnapshotBundle = {
      ...baseSnapshot,
      speed_bonus: {
        early_deadline: '2026-05-01',
        bonus_amount: '500.00',
        currency: 'USD',
      },
    }
    render(
      <OfferCardBundle
        snapshot={snapshotWithBonus}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(screen.getByText('Speed bonus')).toBeInTheDocument()
    expect(screen.getByText('+$500.00')).toBeInTheDocument()
  })

  it('does not render speed bonus when null', () => {
    render(
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(screen.queryByText('Speed bonus')).not.toBeInTheDocument()
  })

  it('expandsCollapsesDeliverableList', async () => {
    const user = userEvent.setup()
    render(<OfferCardBundle snapshot={baseSnapshot} status="sent" side="out" />)

    const toggle = screen.getByRole('button', { name: /deliverables/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('YouTube Video × 2')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('YouTube Video × 2')).toBeInTheDocument()
    expect(screen.getByText('Instagram Reel × 1')).toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('YouTube Video × 2')).not.toBeInTheDocument()
  })

  it('shows accept/reject buttons when side is in, status sent and not expired', () => {
    render(
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.getByRole('button', { name: /accept offer/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('hides actions when side is out', () => {
    render(
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="out"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onAccept and onReject', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    await user.click(screen.getByRole('button', { name: /accept offer/i }))
    expect(onAccept).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('disables buttons while acting', () => {
    render(
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
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
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
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
      <OfferCardBundle
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
