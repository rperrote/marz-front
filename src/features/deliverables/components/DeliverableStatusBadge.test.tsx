import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { DeliverableStatusBadge } from './DeliverableStatusBadge'
import type { DeliverableStatus } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('DeliverableStatusBadge', () => {
  it.each<
    [
      status: DeliverableStatus,
      label: string,
      backgroundClass: string,
      foregroundClass: string,
    ]
  >([
    ['pending', 'Pending', 'bg-muted', 'text-foreground'],
    ['draft_submitted', 'In review', 'bg-info', 'text-info-foreground'],
    [
      'changes_requested',
      'Changes requested',
      'bg-destructive',
      'text-destructive-foreground',
    ],
    ['completed', 'Completed', 'bg-success', 'text-success-foreground'],
    ['paid', 'Paid', 'bg-primary', 'text-primary-foreground'],
  ])(
    'renders %s with the expected label and color classes',
    (status, label, backgroundClass, foregroundClass) => {
      render(<DeliverableStatusBadge status={status} />)

      const badge = screen.getByText(label)

      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(backgroundClass, foregroundClass)
    },
  )

  it('is axe-clean for paid status', async () => {
    const { container } = render(<DeliverableStatusBadge status="paid" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
