import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OfferAcceptedCardIn } from './OfferAcceptedCardIn'
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

describe('OfferAcceptedCardIn', () => {
  it('renders acceptance message and deadline', () => {
    render(<OfferAcceptedCardIn snapshot={snapshot} />)
    expect(screen.getByText('You accepted the offer')).toBeInTheDocument()
    expect(screen.getByText(/Deadline is Oct 12/)).toBeInTheDocument()
  })

  it('renders upload draft button', () => {
    render(<OfferAcceptedCardIn snapshot={snapshot} />)
    expect(
      screen.getByRole('button', { name: /upload draft/i }),
    ).toBeInTheDocument()
  })

  it('calls onUploadDraft when button clicked', async () => {
    const user = userEvent.setup()
    const onUploadDraft = vi.fn()
    render(
      <OfferAcceptedCardIn snapshot={snapshot} onUploadDraft={onUploadDraft} />,
    )
    await user.click(screen.getByRole('button', { name: /upload draft/i }))
    expect(onUploadDraft).toHaveBeenCalledOnce()
  })

  it('has role="article" with descriptive aria-label', () => {
    render(<OfferAcceptedCardIn snapshot={snapshot} />)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label')
    expect(article.getAttribute('aria-label')).toContain('Oct 12')
  })

  it('is axe-clean', async () => {
    const { container } = render(<OfferAcceptedCardIn snapshot={snapshot} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
