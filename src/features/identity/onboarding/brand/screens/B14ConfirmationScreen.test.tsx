import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B14ConfirmationScreen } from './B14ConfirmationScreen'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

describe('B14ConfirmationScreen', () => {
  it('renders confirmation copy', () => {
    render(<B14ConfirmationScreen />)
    expect(screen.getByText(/todo listo/i)).toBeInTheDocument()
  })

  it('renders start button', () => {
    render(<B14ConfirmationScreen />)
    expect(screen.getByTestId('onboarding-start-btn')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B14ConfirmationScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
