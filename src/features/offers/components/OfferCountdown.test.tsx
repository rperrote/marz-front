import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { OfferCountdown } from './OfferCountdown'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferCountdown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('decrements every second until it reaches the expiration handoff state', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))

    render(
      <OfferCountdown
        expiresAt="2026-05-15T12:00:02.000Z"
        status="sent"
      />,
    )

    expect(
      screen.getByText('La oferta vence en 0m 02s'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1000)
    expect(
      screen.getByText('La oferta vence en 0m 01s'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1000)
    expect(screen.getByText('La oferta está expirando...')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)
    expect(screen.getByText('La oferta está expirando...')).toBeInTheDocument()
  })

  it('does not render for non-sent offers', () => {
    const { container } = render(
      <OfferCountdown
        expiresAt="2026-05-15T12:00:02.000Z"
        status="accepted"
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OfferCountdown
        expiresAt="2026-05-15T12:00:02.000Z"
        status="sent"
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
