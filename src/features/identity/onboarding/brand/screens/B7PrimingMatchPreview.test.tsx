import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B7PrimingMatchPreview } from './B7PrimingMatchPreview'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

describe('B7PrimingMatchPreview', () => {
  it('renders copy text', () => {
    render(<B7PrimingMatchPreview />)
    expect(screen.getByText(/preparando tus matches/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B7PrimingMatchPreview />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
