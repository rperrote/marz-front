import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { WorkspaceLayout } from './WorkspaceLayout'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('WorkspaceLayout', () => {
  it('renders rail region and main outlet', () => {
    render(
      <WorkspaceLayout rail={<div data-testid="rail-content">Rail</div>}>
        <div data-testid="outlet-content">Outlet</div>
      </WorkspaceLayout>,
    )

    const rail = screen.getByRole('region', { name: /conversations/i })
    expect(rail).toBeInTheDocument()
    expect(screen.getByTestId('rail-content')).toBeInTheDocument()
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
  })

  it('renders rail with 320px fixed width', () => {
    render(
      <WorkspaceLayout>
        <div>Content</div>
      </WorkspaceLayout>,
    )

    const rail = screen.getByRole('region', { name: /conversations/i })
    expect(rail.className).toContain('w-80')
    expect(rail.className).toContain('shrink-0')
  })

  it('renders main as flex-1', () => {
    render(
      <WorkspaceLayout>
        <div data-testid="child">Content</div>
      </WorkspaceLayout>,
    )

    const main = screen.getByRole('main')
    expect(main.className).toContain('flex-1')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <WorkspaceLayout>
        <div>Content</div>
      </WorkspaceLayout>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
