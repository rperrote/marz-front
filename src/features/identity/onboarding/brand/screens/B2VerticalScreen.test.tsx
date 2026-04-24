import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B2VerticalScreen } from './B2VerticalScreen'
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
  useBrandOnboardingStore.setState({ currentStepIndex: 1, vertical: undefined })
})

describe('B2VerticalScreen', () => {
  it('renders 16 vertical cards', () => {
    render(<B2VerticalScreen />)
    const cards = screen.getAllByRole('radio')
    expect(cards).toHaveLength(16)
  })

  it('selects a vertical on click', async () => {
    const user = userEvent.setup()
    render(<B2VerticalScreen />)
    await user.click(screen.getByText('Fintech'))
    expect(useBrandOnboardingStore.getState().vertical).toBe('fintech')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B2VerticalScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
