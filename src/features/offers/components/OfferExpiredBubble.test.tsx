import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferExpiredBubble } from './OfferExpiredBubble'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferExpiredBubble', () => {
  it('renders with viewerSide "actor" (out direction)', () => {
    render(<OfferExpiredBubble viewerSide="actor" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Offer expired')).toBeInTheDocument()
  })

  it('renders with viewerSide "recipient" (in direction)', () => {
    render(<OfferExpiredBubble viewerSide="recipient" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Offer expired')).toBeInTheDocument()
  })

  it('has role="status" with aria-label', () => {
    render(<OfferExpiredBubble viewerSide="actor" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Offer expired')
  })

  it('is axe-clean', async () => {
    const { container } = render(<OfferExpiredBubble viewerSide="actor" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
