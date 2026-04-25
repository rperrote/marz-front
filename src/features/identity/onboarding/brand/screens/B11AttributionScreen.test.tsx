import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { B11AttributionScreen } from './B11AttributionScreen'
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
    currentStepIndex: 10,
    attribution: undefined,
  })
})

describe('B11AttributionScreen', () => {
  it('renders 8 attribution options', () => {
    render(<B11AttributionScreen />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(8)
  })

  it('selects non-referral source', async () => {
    const user = userEvent.setup()
    render(<B11AttributionScreen />)
    await user.click(screen.getByText('Instagram'))
    expect(useBrandOnboardingStore.getState().attribution).toEqual({
      source: 'instagram',
    })
  })

  it('shows referral input when referral selected', async () => {
    const user = userEvent.setup()
    render(<B11AttributionScreen />)
    await user.click(screen.getByRole('radio', { name: /referido/i }))
    expect(screen.getByLabelText(/quién te recomendó/i)).toBeInTheDocument()
  })

  it('stores referral text', async () => {
    const user = userEvent.setup()
    render(<B11AttributionScreen />)
    await user.click(screen.getByRole('radio', { name: /referido/i }))
    await user.type(screen.getByLabelText(/quién te recomendó/i), 'María')
    expect(useBrandOnboardingStore.getState().attribution).toEqual({
      source: 'referral',
      referral_text: 'María',
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B11AttributionScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
