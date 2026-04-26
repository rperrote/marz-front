import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScoringDimensionCard } from './ScoringDimensionCard'
import type { ScoringDimension } from '../store'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const baseDimension: ScoringDimension = {
  id: 'test-dim-1',
  name: 'Engagement',
  description: 'Engagement rate',
  weight_pct: 50,
  positive_signals: ['high likes'],
  negative_signals: ['spam'],
}

describe('ScoringDimensionCard', () => {
  it('renders dimension data', () => {
    render(
      <ScoringDimensionCard
        index={0}
        dimension={baseDimension}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('Engagement')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Engagement rate')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('calls onChange when name is edited', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ScoringDimensionCard
        index={0}
        dimension={baseDimension}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )
    const nameInput = screen.getByDisplayValue('Engagement')
    await user.type(nameInput, 'X')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1)?.[0] as ScoringDimension
    expect(lastCall.name).toBe('EngagementX')
  })

  it('calls onRemove when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(
      <ScoringDimensionCard
        index={0}
        dimension={baseDimension}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /eliminar dimensión 1/i }),
    )
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('renders existing signals as chips', () => {
    render(
      <ScoringDimensionCard
        index={0}
        dimension={baseDimension}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByText('high likes')).toBeInTheDocument()
    expect(screen.getByText('spam')).toBeInTheDocument()
  })

  it('adds a new positive signal', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ScoringDimensionCard
        index={0}
        dimension={{ ...baseDimension, positive_signals: [] }}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )
    const inputs = screen.getAllByPlaceholderText('Agregar señal…')
    await user.type(inputs[0]!, 'new signal{enter}')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1)?.[0] as ScoringDimension
    expect(lastCall.positive_signals).toContain('new signal')
  })
})
