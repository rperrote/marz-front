import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { Circle } from 'lucide-react'
import { OnboardingVerticalCard } from './OnboardingVerticalCard'

describe('OnboardingVerticalCard', () => {
  it('renders label', () => {
    render(
      <OnboardingVerticalCard
        label="Fintech"
        icon={Circle}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByText('Fintech')).toBeInTheDocument()
  })

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingVerticalCard
        label="Fintech"
        icon={Circle}
        selected={false}
        onToggle={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('radio'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onToggle on Space key', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingVerticalCard
        label="Fintech"
        icon={Circle}
        selected={false}
        onToggle={onToggle}
      />,
    )
    screen.getByRole('radio').focus()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('reflects selected state via aria-checked', () => {
    render(
      <OnboardingVerticalCard
        label="Fintech"
        icon={Circle}
        selected={true}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingVerticalCard
        label="Fintech"
        icon={Circle}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
