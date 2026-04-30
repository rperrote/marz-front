import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferAcceptedCardOut } from './OfferAcceptedCardOut'
import type { OfferAcceptedSnap } from '../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const snapshot: OfferAcceptedSnap = {
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
  accepted_at: '2026-04-26T14:00:00Z',
}

describe('OfferAcceptedCardOut', () => {
  it('renders creator name and deadline', () => {
    render(
      <OfferAcceptedCardOut snapshot={snapshot} creatorName="María García" />,
    )
    expect(
      screen.getByText('María García accepted the offer'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Deadline is Oct 12/)).toBeInTheDocument()
  })

  it('uses first name in description', () => {
    render(
      <OfferAcceptedCardOut snapshot={snapshot} creatorName="María García" />,
    )
    expect(screen.getByText(/María is preparing the draft/)).toBeInTheDocument()
  })

  it('has role="article" with descriptive aria-label', () => {
    render(
      <OfferAcceptedCardOut snapshot={snapshot} creatorName="María García" />,
    )
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label')
    expect(article.getAttribute('aria-label')).toContain('María García')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OfferAcceptedCardOut snapshot={snapshot} creatorName="María García" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
