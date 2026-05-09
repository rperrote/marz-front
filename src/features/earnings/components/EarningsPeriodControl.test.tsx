import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { EarningsPeriodControl } from './EarningsPeriodControl'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

describe('EarningsPeriodControl', () => {
  it('marks the active period and emits period changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<EarningsPeriodControl value="30d" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: '30d' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(screen.getByRole('radio', { name: '90d' }))

    expect(onChange).toHaveBeenCalledWith('90d')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <EarningsPeriodControl value="12m" onChange={vi.fn()} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
