import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { WizardProgress } from './WizardProgress'

describe('WizardProgress', () => {
  it('renders with correct aria attributes', () => {
    render(<WizardProgress percent={42} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps value to 0-100', () => {
    const { rerender } = render(<WizardProgress percent={-10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )

    rerender(<WizardProgress percent={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('is axe-clean', async () => {
    const { container } = render(<WizardProgress percent={50} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
