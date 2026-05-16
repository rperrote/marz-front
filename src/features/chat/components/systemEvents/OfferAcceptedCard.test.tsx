import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferAcceptedCard } from './OfferAcceptedCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferAcceptedCard', () => {
  it('renders the event bubble', async () => {
    const { container } = render(
      <OfferAcceptedCard
        message={makeOfferSystemMessage('OfferAccepted', {
          status: 'accepted',
          accepted_at: '2026-05-11T12:00:00Z',
        })}
      />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta aceptada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oferta aceptada')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
