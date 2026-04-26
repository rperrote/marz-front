import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { ConversationFilterTabs } from './ConversationFilterTabs'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockReset()
})

describe('ConversationFilterTabs', () => {
  it('renders tablist with three tabs', () => {
    render(<ConversationFilterTabs value="all" />)

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('marks the active tab as selected', () => {
    render(<ConversationFilterTabs value="unread" />)

    expect(screen.getByRole('tab', { name: 'Sin leer' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Todas' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('navigates with replace when clicking a different tab', async () => {
    const user = userEvent.setup()
    render(<ConversationFilterTabs value="all" />)

    await user.click(screen.getByRole('tab', { name: 'Sin leer' }))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const call = mockNavigate.mock.calls[0]![0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    expect(call.replace).toBe(true)
    const result = call.search({ search: 'test' })
    expect(result).toEqual({ search: 'test', filter: 'unread' })
  })

  it('navigates to "all" by omitting filter param', async () => {
    const user = userEvent.setup()
    render(<ConversationFilterTabs value="unread" />)

    await user.click(screen.getByRole('tab', { name: 'Todas' }))

    const call = mockNavigate.mock.calls[0]![0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    const result = call.search({ search: 'hello' })
    expect(result).toEqual({ search: 'hello', filter: undefined })
  })

  it('does not navigate when clicking the already-active tab', async () => {
    const user = userEvent.setup()
    render(<ConversationFilterTabs value="all" />)

    await user.click(screen.getByRole('tab', { name: 'Todas' }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to needs_reply filter', async () => {
    const user = userEvent.setup()
    render(<ConversationFilterTabs value="all" />)

    await user.click(screen.getByRole('tab', { name: 'Por responder' }))

    const call = mockNavigate.mock.calls[0]![0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    const result = call.search({})
    expect(result.filter).toBe('needs_reply')
  })

  it('is axe-clean', async () => {
    const { container } = render(<ConversationFilterTabs value="all" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
