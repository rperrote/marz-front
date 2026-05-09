import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getMatchScoreBand, MatchScoreBadge } from './MatchScoreBadge'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

describe('MatchScoreBadge', () => {
  it.each([
    [0, 'low'],
    [59, 'low'],
    [60, 'medium'],
    [79, 'medium'],
    [80, 'high'],
    [100, 'high'],
  ] as const)('classifies %i as %s', (score, band) => {
    expect(getMatchScoreBand(score)).toBe(band)
  })

  it('renders the score with an accessible band label', () => {
    render(<MatchScoreBadge score={80} />)

    expect(
      screen.getByLabelText('80% de match, match alto'),
    ).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})
