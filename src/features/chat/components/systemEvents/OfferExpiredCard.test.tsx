import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferExpiredCard } from './OfferExpiredCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferExpiredCard', () => {
  it('renders the event bubble', async () => {
    const { container } = render(
      <OfferExpiredCard
        message={makeOfferSystemMessage('OfferExpired', {
          status: 'expired',
          expired_at: '2026-05-20T12:00:00Z',
        })}
      />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta vencida' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oferta vencida')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
