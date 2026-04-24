import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingProgress } from './OnboardingProgress'

describe('OnboardingProgress', () => {
  it('renders with correct aria attributes', () => {
    render(<OnboardingProgress percent={42} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps value to 0-100', () => {
    const { rerender } = render(<OnboardingProgress percent={-10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )

    rerender(<OnboardingProgress percent={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('is axe-clean', async () => {
    const { container } = render(<OnboardingProgress percent={50} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
