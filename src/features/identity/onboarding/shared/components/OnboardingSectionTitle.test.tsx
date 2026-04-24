import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { OnboardingSectionTitle } from './OnboardingSectionTitle'

describe('OnboardingSectionTitle', () => {
  it('renders title', () => {
    render(<OnboardingSectionTitle title="Bienvenido" />)
    expect(
      screen.getByRole('heading', { name: 'Bienvenido' }),
    ).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <OnboardingSectionTitle title="Hola" subtitle="Completá tu perfil" />,
    )
    expect(screen.getByText('Completá tu perfil')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    const { container } = render(<OnboardingSectionTitle title="Hola" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingSectionTitle title="Título" subtitle="Sub" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
