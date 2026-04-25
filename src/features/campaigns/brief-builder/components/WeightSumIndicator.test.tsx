import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightSumIndicator } from './WeightSumIndicator'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('WeightSumIndicator', () => {
  it('shows green styling when sum equals 100', () => {
    render(<WeightSumIndicator sum={100} />)
    const el = screen.getByText('Total 100 / 100')
    expect(el.className).toContain('emerald')
    expect(el.className).not.toContain('destructive')
  })

  it('shows red styling when sum does not equal 100', () => {
    render(<WeightSumIndicator sum={80} />)
    const el = screen.getByText('Total 80 / 100')
    expect(el.className).toContain('destructive')
    expect(el.className).not.toContain('emerald')
  })

  it('has aria-live polite for screen readers', () => {
    render(<WeightSumIndicator sum={50} />)
    const el = screen.getByText('Total 50 / 100')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('shows zero correctly', () => {
    render(<WeightSumIndicator sum={0} />)
    expect(screen.getByText('Total 0 / 100')).toBeInTheDocument()
  })
})
