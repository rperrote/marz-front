import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferRejectedBubble } from './OfferRejectedBubble'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferRejectedBubble', () => {
  it('renders with viewerSide "actor" (out direction)', () => {
    render(<OfferRejectedBubble viewerSide="actor" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Offer rejected')).toBeInTheDocument()
  })

  it('renders with viewerSide "recipient" (in direction)', () => {
    render(<OfferRejectedBubble viewerSide="recipient" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Offer rejected')).toBeInTheDocument()
  })

  it('has role="status" with aria-label', () => {
    render(<OfferRejectedBubble viewerSide="actor" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Offer rejected')
  })

  it('is axe-clean', async () => {
    const { container } = render(<OfferRejectedBubble viewerSide="actor" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
