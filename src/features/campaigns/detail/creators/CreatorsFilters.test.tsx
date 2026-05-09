import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { CreatorsFilters, hasActiveFilters } from './CreatorsFilters'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CreatorsFilters', () => {
  it('debounces search changes', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    const onParamsChange = vi.fn()

    render(<CreatorsFilters params={{}} onParamsChange={onParamsChange} />)

    await user.type(
      screen.getByRole('textbox', { name: 'Search creators' }),
      'ana',
    )

    expect(onParamsChange).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onParamsChange).toHaveBeenCalledWith({ search: 'ana' })
  })

  it('toggles status chips and clears filters', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    const onParamsChange = vi.fn()

    render(
      <CreatorsFilters
        params={{ status: 'active', platform: 'tiktok', search: 'ana' }}
        onParamsChange={onParamsChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(onParamsChange).toHaveBeenCalledWith({
      search: 'ana',
      platform: 'tiktok',
      status: undefined,
    })

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onParamsChange).toHaveBeenLastCalledWith({})
  })

  it('detects active filters', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters({ search: '  ' })).toBe(false)
    expect(hasActiveFilters({ platform: 'youtube' })).toBe(true)
    expect(hasActiveFilters({ status: 'paid' })).toBe(true)
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CreatorsFilters params={{}} onParamsChange={vi.fn()} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
