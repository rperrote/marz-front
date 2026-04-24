import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingOptionChip } from './OnboardingOptionChip'

describe('OnboardingOptionChip', () => {
  it('renders label', () => {
    render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByText('Moda')).toBeInTheDocument()
  })

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onToggle on Space key', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={onToggle}
      />,
    )
    screen.getByRole('checkbox').focus()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('reflects selected state via aria-checked', () => {
    const { rerender } = render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'false',
    )

    rerender(
      <OnboardingOptionChip label="Moda" selected={true} onToggle={() => {}} />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('supports radio role', () => {
    render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={() => {}}
        role="radio"
      />,
    )
    expect(screen.getByRole('radio')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingOptionChip
        label="Moda"
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
