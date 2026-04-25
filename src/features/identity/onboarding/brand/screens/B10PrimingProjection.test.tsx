import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { B10PrimingProjection } from './B10PrimingProjection'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

describe('B10PrimingProjection', () => {
  it('renders copy text', () => {
    render(<B10PrimingProjection />)
    expect(
      screen.getByText(/así se ve lo que podés alcanzar/i),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<B10PrimingProjection />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
