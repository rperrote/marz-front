import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B5ExperienceScreen } from './B5ExperienceScreen'
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
    currentStepIndex: 4,
    creator_experience: undefined,
    creator_sourcing_history: undefined,
  })
})

describe('B5ExperienceScreen', () => {
  it('renders experience and sourcing groups', () => {
    render(<B5ExperienceScreen />)
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBe(7)
  })

  it('selects experience on click', async () => {
    const user = userEvent.setup()
    render(<B5ExperienceScreen />)
    await user.click(screen.getByText(/nunca trabajé/i))
    expect(useBrandOnboardingStore.getState().creator_experience).toBe('never')
  })

  it('selects sourcing on click', async () => {
    const user = userEvent.setup()
    render(<B5ExperienceScreen />)
    await user.click(screen.getByText(/sin experiencia/i))
    expect(useBrandOnboardingStore.getState().creator_sourcing_history).toBe(
      'none',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B5ExperienceScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
