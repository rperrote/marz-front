import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ConversationSearchInput } from './ConversationSearchInput'

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
  vi.useFakeTimers({ shouldAdvanceTime: true })
  mockNavigate.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

function getLastSearchResult(prev: Record<string, unknown> = {}) {
  const lastCall = mockNavigate.mock.calls.at(-1)?.[0] as
    | {
        search: (prev: Record<string, unknown>) => Record<string, unknown>
        replace: boolean
      }
    | undefined
  if (!lastCall) return undefined
  return { result: lastCall.search(prev), replace: lastCall.replace }
}

describe('ConversationSearchInput', () => {
  it('renders with aria-label', () => {
    render(<ConversationSearchInput />)
    expect(
      screen.getByRole('searchbox', { name: 'Buscar conversaciones' }),
    ).toBeInTheDocument()
  })

  it('debounces typing and navigates with search param', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    render(<ConversationSearchInput />)

    const input = screen.getByRole('searchbox')

    mockNavigate.mockClear()
    await user.type(input, 'hello')

    await act(async () => {
      vi.advanceTimersByTime(250)
    })

    const nav = getLastSearchResult({ filter: 'all' })
    expect(nav).toBeDefined()
    expect(nav!.replace).toBe(true)
    expect(nav!.result).toEqual({ filter: 'all', search: 'hello' })
  })

  it('omits search param when input is cleared', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    render(<ConversationSearchInput value="test" />)

    const input = screen.getByRole('searchbox')
    await user.clear(input)

    await act(async () => {
      vi.advanceTimersByTime(250)
    })

    const nav = getLastSearchResult({ filter: 'unread' })
    expect(nav).toBeDefined()
    expect(nav!.result).toEqual({ filter: 'unread', search: undefined })
  })

  it('trims whitespace-only input to undefined', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    render(<ConversationSearchInput />)

    const input = screen.getByRole('searchbox')

    mockNavigate.mockClear()
    await user.type(input, '   ')

    await act(async () => {
      vi.advanceTimersByTime(250)
    })

    const nav = getLastSearchResult({})
    expect(nav).toBeDefined()
    expect(nav!.result.search).toBeUndefined()
  })

  it('shows clear button when value is present', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    render(<ConversationSearchInput value="test" />)

    expect(
      screen.getByRole('button', { name: 'Limpiar búsqueda' }),
    ).toBeInTheDocument()

    mockNavigate.mockClear()
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    await act(async () => {
      vi.advanceTimersByTime(250)
    })

    const nav = getLastSearchResult({})
    expect(nav).toBeDefined()
    expect(nav!.result.search).toBeUndefined()
  })

  it('enforces max length of 80 characters', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    render(<ConversationSearchInput />)

    const input = screen.getByRole<HTMLInputElement>('searchbox')
    const longText = 'a'.repeat(100)
    await user.type(input, longText)

    expect(input.value).toHaveLength(80)
  })
})
