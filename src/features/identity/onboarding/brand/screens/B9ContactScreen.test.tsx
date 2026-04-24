import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B9ContactScreen } from './B9ContactScreen'
import { useBrandOnboardingStore } from '../store'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

beforeEach(() => {
  useBrandOnboardingStore.setState({
    currentStepIndex: 8,
    contact_name: undefined,
    contact_title: undefined,
    contact_whatsapp_e164: undefined,
  })
})

describe('B9ContactScreen', () => {
  it('renders three contact fields', () => {
    render(<B9ContactScreen />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cargo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument()
  })

  it('updates store on name input', async () => {
    const user = userEvent.setup()
    render(<B9ContactScreen />)
    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    expect(useBrandOnboardingStore.getState().contact_name).toBe('Juan')
  })

  it('formats whatsapp to E.164', async () => {
    const user = userEvent.setup()
    render(<B9ContactScreen />)
    await user.type(screen.getByLabelText(/whatsapp/i), '+5491155551234')
    expect(useBrandOnboardingStore.getState().contact_whatsapp_e164).toBe(
      '+5491155551234',
    )
  })

  it('shows error for invalid E.164', async () => {
    const user = userEvent.setup()
    render(<B9ContactScreen />)
    await user.type(screen.getByLabelText(/whatsapp/i), '+1')
    expect(screen.getByText(/formato inválido/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B9ContactScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
