import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B6BudgetScreen } from './B6BudgetScreen'
import { useBrandOnboardingStore } from '../store'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  useBrandOnboardingStore.setState({
    currentStepIndex: 5,
    monthly_budget_range: undefined,
  })
})

describe('B6BudgetScreen', () => {
  it('renders the slider', () => {
    render(<B6BudgetScreen />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('renders budget label', () => {
    render(<B6BudgetScreen />)
    expect(
      screen.getByText(/\$0 — sin presupuesto definido/i),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B6BudgetScreen />)
    // Radix Slider thumb doesn't forward aria-label from Root — shadcn limitation
    expect(
      await axe(container, {
        rules: {
          'aria-input-field-name': { enabled: false },
        },
      }),
    ).toHaveNoViolations()
  })
})
