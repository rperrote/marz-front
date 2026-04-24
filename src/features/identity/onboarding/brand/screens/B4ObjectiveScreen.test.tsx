import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B4ObjectiveScreen } from './B4ObjectiveScreen'
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
    currentStepIndex: 3,
    marketing_objective: undefined,
  })
})

describe('B4ObjectiveScreen', () => {
  it('renders 4 objective cards', () => {
    render(<B4ObjectiveScreen />)
    const cards = screen.getAllByRole('radio')
    expect(cards).toHaveLength(4)
  })

  it('selects an objective on click', async () => {
    const user = userEvent.setup()
    render(<B4ObjectiveScreen />)
    await user.click(screen.getByText('Performance'))
    expect(useBrandOnboardingStore.getState().marketing_objective).toBe(
      'performance',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B4ObjectiveScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
