import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B3PrimingSocialProof } from './B3PrimingSocialProof'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

describe('B3PrimingSocialProof', () => {
  it('renders copy text', () => {
    render(<B3PrimingSocialProof />)
    expect(screen.getByText(/miles de marcas/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B3PrimingSocialProof />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
