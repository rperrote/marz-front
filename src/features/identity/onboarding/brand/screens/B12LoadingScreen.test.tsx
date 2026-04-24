import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B12LoadingScreen } from './B12LoadingScreen'

const mockNavigate = vi.fn()

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

afterEach(() => {
  vi.useRealTimers()
  mockNavigate.mockReset()
})

describe('B12LoadingScreen', () => {
  it('renders loading text', () => {
    render(<B12LoadingScreen />)
    expect(screen.getByText(/preparando todo/i)).toBeInTheDocument()
  })

  it('auto-advances after 2.5s', () => {
    vi.useFakeTimers()
    render(<B12LoadingScreen />)
    vi.advanceTimersByTime(2500)
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B12LoadingScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
