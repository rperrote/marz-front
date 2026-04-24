import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingField } from './OnboardingField'

describe('OnboardingField', () => {
  it('renders label and children', () => {
    render(
      <OnboardingField label="Nombre">
        <input data-testid="input" />
      </OnboardingField>,
    )
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByTestId('input')).toBeInTheDocument()
  })

  it('renders hint text', () => {
    render(
      <OnboardingField label="Email" hint="Usamos esto para contactarte">
        <input />
      </OnboardingField>,
    )
    expect(screen.getByText('Usamos esto para contactarte')).toBeInTheDocument()
  })

  it('renders error and hides hint', () => {
    render(
      <OnboardingField label="Email" hint="hint text" error="Requerido">
        <input />
      </OnboardingField>,
    )
    expect(screen.getByText('Requerido')).toBeInTheDocument()
    expect(screen.queryByText('hint text')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingField label="Nombre">
        <input />
      </OnboardingField>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
