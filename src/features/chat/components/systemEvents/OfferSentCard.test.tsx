import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferSentCard } from './OfferSentCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferSentCard', () => {
  it('renders the event bubble', async () => {
    const { container } = render(
      <OfferSentCard message={makeOfferSystemMessage('OfferSent')} />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta enviada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oferta enviada')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('returns null when snapshot cannot be extracted', () => {
    const { container } = render(
      <OfferSentCard
        message={makeOfferSystemMessage('OfferSent', {
          id: undefined,
          offer_mode: undefined,
        })}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
