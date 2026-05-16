import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferRejectedCard } from './OfferRejectedCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferRejectedCard', () => {
  it('renders the event bubble', async () => {
    const { container } = render(
      <OfferRejectedCard
        message={makeOfferSystemMessage('OfferRejected', {
          status: 'rejected',
          rejected_at: '2026-05-12T12:00:00Z',
        })}
      />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta rechazada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oferta rechazada')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
