import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingFooter } from './OnboardingFooter'

describe('OnboardingFooter', () => {
  it('calls onNext when clicking next button', async () => {
    const onNext = vi.fn()
    render(<OnboardingFooter onNext={onNext} />)
    await userEvent.click(screen.getByText('Continuar'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('calls onBack when clicking back button', async () => {
    const onBack = vi.fn()
    render(<OnboardingFooter onBack={onBack} onNext={() => {}} />)
    await userEvent.click(screen.getByText('Atrás'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('does not render back button when onBack is not provided', () => {
    render(<OnboardingFooter onNext={() => {}} />)
    expect(screen.queryByText('Atrás')).not.toBeInTheDocument()
  })

  it('disables next button when nextDisabled is true', () => {
    render(<OnboardingFooter onNext={() => {}} nextDisabled />)
    expect(screen.getByText('Continuar').closest('button')).toBeDisabled()
  })

  it('uses custom nextLabel', () => {
    render(<OnboardingFooter onNext={() => {}} nextLabel="Finalizar" />)
    expect(screen.getByText('Finalizar')).toBeInTheDocument()
  })

  it('shows spinner when isLoading', () => {
    render(<OnboardingFooter onNext={() => {}} isLoading />)
    expect(screen.queryByText('Continuar')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingFooter onBack={() => {}} onNext={() => {}} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
