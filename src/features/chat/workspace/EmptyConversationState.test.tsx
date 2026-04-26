import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { EmptyConversationState } from './EmptyConversationState'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('EmptyConversationState', () => {
  it('renders heading with spec text', () => {
    render(<EmptyConversationState />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Select a conversation')
  })

  it('is axe-clean', async () => {
    const { container } = render(<EmptyConversationState />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
