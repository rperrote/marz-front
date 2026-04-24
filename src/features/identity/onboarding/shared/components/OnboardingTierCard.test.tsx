import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { Sprout } from 'lucide-react'
import { OnboardingTierCard } from './OnboardingTierCard'

describe('OnboardingTierCard', () => {
  it('renders label and description', () => {
    render(
      <OnboardingTierCard
        label="Semilla"
        description="1K–5K followers"
        icon={Sprout}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByText('Semilla')).toBeInTheDocument()
    expect(screen.getByText('1K–5K followers')).toBeInTheDocument()
  })

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingTierCard
        label="Semilla"
        description="1K–5K followers"
        icon={Sprout}
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
      <OnboardingTierCard
        label="Semilla"
        description="1K–5K followers"
        icon={Sprout}
        selected={false}
        onToggle={onToggle}
      />,
    )
    screen.getByRole('radio').focus()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('reflects selected state', () => {
    render(
      <OnboardingTierCard
        label="Semilla"
        description="1K–5K followers"
        icon={Sprout}
        selected={true}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingTierCard
        label="Semilla"
        description="1K–5K followers"
        icon={Sprout}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
