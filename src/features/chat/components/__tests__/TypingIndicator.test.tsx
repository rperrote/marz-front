import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { useTypingStore } from '#/features/chat/stores/typingStore'
import { TypingIndicator } from '../TypingIndicator'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

beforeEach(() => {
  useTypingStore.setState({ entries: {} })
})

describe('TypingIndicator', () => {
  it('renders nothing when no one is typing', () => {
    const { container } = render(
      <TypingIndicator conversationId="conv-1" currentAccountId="me" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when only the current user is typing', () => {
    useTypingStore.getState().setTyping('conv-1', 'me')
    const { container } = render(
      <TypingIndicator conversationId="conv-1" currentAccountId="me" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when another user is typing', () => {
    useTypingStore.getState().setTyping('conv-1', 'other-user')
    render(<TypingIndicator conversationId="conv-1" currentAccountId="me" />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Escribiendo...')
  })

  it('renders when another user is typing alongside current user', () => {
    useTypingStore.getState().setTyping('conv-1', 'me')
    useTypingStore.getState().setTyping('conv-1', 'other-user')
    render(<TypingIndicator conversationId="conv-1" currentAccountId="me" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render for a different conversation', () => {
    useTypingStore.getState().setTyping('conv-2', 'other-user')
    const { container } = render(
      <TypingIndicator conversationId="conv-1" currentAccountId="me" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('is axe-clean when visible', async () => {
    useTypingStore.getState().setTyping('conv-1', 'other-user')
    const { container } = render(
      <TypingIndicator conversationId="conv-1" currentAccountId="me" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
