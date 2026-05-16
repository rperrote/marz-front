import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferCancelledCard } from './OfferCancelledCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferCancelledCard', () => {
  it('renders the event bubble with pre_accept copy', async () => {
    const { container } = render(
      <OfferCancelledCard
        message={makeOfferSystemMessage('OfferCancelled', {
          cancelled_at: '2026-05-13T12:00:00Z',
        })}
        phase="pre_accept"
      />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta cancelada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oferta cancelada')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders post_accept copy', () => {
    render(
      <OfferCancelledCard
        message={makeOfferSystemMessage('OfferCancelled')}
        phase="post_accept"
      />,
    )

    expect(
      screen.getByText('Oferta cancelada tras aceptación'),
    ).toBeInTheDocument()
  })

  it('uses post_accept copy from snapshot phase when phase prop is omitted', () => {
    render(
      <OfferCancelledCard
        message={makeOfferSystemMessage('OfferCancelled', {
          phase: 'post_accept',
        })}
      />,
    )

    expect(
      screen.getByText('Oferta cancelada tras aceptación'),
    ).toBeInTheDocument()
  })

  it('defaults to pre_accept copy when phase prop and snapshot phase are omitted', () => {
    render(
      <OfferCancelledCard message={makeOfferSystemMessage('OfferCancelled')} />,
    )

    expect(screen.getAllByText('Oferta cancelada').length).toBeGreaterThan(0)
  })
})
