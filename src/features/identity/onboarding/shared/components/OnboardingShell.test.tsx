import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingShell } from './OnboardingShell'

describe('OnboardingShell', () => {
  it('renders topbar, progress, children, and footer', () => {
    render(
      <OnboardingShell
        stepLabel="Paso 2 de 5"
        percent={40}
        onNext={() => {}}
        onBack={() => {}}
      >
        <p>Content</p>
      </OnboardingShell>,
    )
    expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '40',
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Continuar')).toBeInTheDocument()
    expect(screen.getByText('Atrás')).toBeInTheDocument()
  })

  it('calls onNext and onBack', async () => {
    const onNext = vi.fn()
    const onBack = vi.fn()
    render(
      <OnboardingShell
        stepLabel="Step"
        percent={0}
        onNext={onNext}
        onBack={onBack}
      >
        <p>Content</p>
      </OnboardingShell>,
    )
    await userEvent.click(screen.getByText('Continuar'))
    expect(onNext).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByText('Atrás'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingShell
        stepLabel="Step"
        percent={50}
        onNext={() => {}}
        onBack={() => {}}
      >
        <p>Content</p>
      </OnboardingShell>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
