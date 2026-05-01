import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OfferTypeChooser } from './OfferTypeChooser'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferTypeChooser', () => {
  it('renders three options', () => {
    render(<OfferTypeChooser value="single" onChange={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: /single/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /bundle/i })).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /multi-stage/i }),
    ).toBeInTheDocument()
  })

  it('calls onChange when a different option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OfferTypeChooser value="single" onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: /bundle/i }))
    expect(onChange).toHaveBeenCalledWith('bundle')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <OfferTypeChooser value="single" onChange={vi.fn()} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
