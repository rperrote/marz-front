import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B1IdentityScreen } from './B1IdentityScreen'
import { useBrandOnboardingStore } from '../store'

vi.mock('#/shared/api/generated/onboarding/onboarding', () => ({
  useBrandEnrichment: () => ({ data: null, isLoading: false }),
}))

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
    currentStepIndex: 0,
    name: undefined,
    website_url: undefined,
  })
})

describe('B1IdentityScreen', () => {
  it('renders name and website fields', () => {
    render(<B1IdentityScreen />)
    expect(screen.getByLabelText(/nombre de la marca/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument()
  })

  it('updates store on name change', async () => {
    const user = userEvent.setup()
    render(<B1IdentityScreen />)
    await user.type(screen.getByLabelText(/nombre de la marca/i), 'Acme')
    expect(useBrandOnboardingStore.getState().name).toBe('Acme')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B1IdentityScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
