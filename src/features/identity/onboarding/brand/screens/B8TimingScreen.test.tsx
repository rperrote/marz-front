import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B8TimingScreen } from './B8TimingScreen'
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
    currentStepIndex: 7,
    timing: undefined,
  })
})

describe('B8TimingScreen', () => {
  it('renders 4 timing options', () => {
    render(<B8TimingScreen />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
  })

  it('selects timing on click', async () => {
    const user = userEvent.setup()
    render(<B8TimingScreen />)
    await user.click(screen.getByText(/^lanzo ya$/i))
    expect(useBrandOnboardingStore.getState().timing).toBe('launch_now')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B8TimingScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
