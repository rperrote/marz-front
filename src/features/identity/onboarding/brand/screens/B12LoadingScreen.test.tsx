import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    expect(screen.getByText(/armando tu shortlist/i)).toBeInTheDocument()
  })

  it('auto-advances once the four steps complete', async () => {
    render(<B12LoadingScreen />)
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalled()
      },
      { timeout: 700 * 4 + 500 + 1000 },
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B12LoadingScreen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
