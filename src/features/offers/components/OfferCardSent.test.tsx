import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferCardSent } from './OfferCardSent'
import type { OfferSnapshot, OfferStatus } from '../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

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

const statuses: OfferStatus[] = ['sent', 'accepted', 'rejected', 'expired']

describe('OfferCardSent', () => {
  it.each(statuses)('renders with status "%s"', (status) => {
    render(<OfferCardSent snapshot={baseSnapshot} status={status} />)
    expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
    expect(screen.getByText('Oct 12')).toBeInTheDocument()
  })

  it('displays campaign name from snapshot', () => {
    render(<OfferCardSent snapshot={baseSnapshot} status="sent" />)
    expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
  })

  it('displays platform label', () => {
    render(<OfferCardSent snapshot={baseSnapshot} status="sent" />)
    expect(screen.getByText('YouTube Video')).toBeInTheDocument()
  })

  it('has role="article" with descriptive aria-label', () => {
    render(<OfferCardSent snapshot={baseSnapshot} status="sent" />)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label')
    expect(article.getAttribute('aria-label')).toContain('$4,500.00')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OfferCardSent snapshot={baseSnapshot} status="sent" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
