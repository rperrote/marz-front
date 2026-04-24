import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B13PaywallScreen } from './B13PaywallScreen'

const mockNavigate = vi.fn()

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('B13PaywallScreen', () => {
  it('renders plan card with disabled CTA', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()
    expect(screen.getByText('Start trial')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start trial' })).toBeDisabled()
  })

  it('renders skip link', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText(/continuar sin suscribirme/i)).toBeInTheDocument()
  })

  it('skip navigates to next step', async () => {
    const user = userEvent.setup()
    render(<B13PaywallScreen />)
    await user.click(screen.getByText(/continuar sin suscribirme/i))
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B13PaywallScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
