import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ConversationRailItem } from './ConversationRailItem'
import type { ConversationListItem } from './types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeConversation(
  overrides: Partial<ConversationListItem> = {},
): ConversationListItem {
  return {
    id: 'conv-1',
    counterpart: {
      kind: 'creator_profile',
      id: 'creator-1',
      display_name: 'Ana García',
      avatar_url: null,
      handle: 'anagarcia',
    },
    last_activity_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_message_preview: {
      kind: 'text',
      text: 'Hola, te escribo por la campaña',
      author_is_self: false,
    },
    unread_count: 0,
    needs_reply: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('ConversationRailItem', () => {
  it('renders counterpart name and text preview', () => {
    render(<ConversationRailItem conversation={makeConversation()} />)

    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(
      screen.getByText(/Hola, te escribo por la campaña/),
    ).toBeInTheDocument()
  })

  it('renders avatar fallback initial when avatar_url is null', () => {
    render(<ConversationRailItem conversation={makeConversation()} />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders "Conversación iniciada" for empty preview kind', () => {
    const conv = makeConversation({
      last_message_preview: {
        kind: 'empty',
        text: '',
        author_is_self: false,
      },
    })
    render(<ConversationRailItem conversation={conv} />)

    expect(screen.getByText(/Conversación iniciada/)).toBeInTheDocument()
  })

  it('renders "Archivo adjunto" for attachment preview kind', () => {
    const conv = makeConversation({
      last_message_preview: {
        kind: 'attachment',
        text: 'image.png',
        author_is_self: false,
      },
    })
    render(<ConversationRailItem conversation={conv} />)

    expect(screen.getByText(/Archivo adjunto/)).toBeInTheDocument()
  })

  it('renders system_event text as-is', () => {
    const conv = makeConversation({
      last_message_preview: {
        kind: 'system_event',
        text: 'Oferta aceptada',
        author_is_self: false,
      },
    })
    render(<ConversationRailItem conversation={conv} />)

    expect(screen.getByText(/Oferta aceptada/)).toBeInTheDocument()
  })

  it('shows unread indicator when unread_count > 0', () => {
    const conv = makeConversation({ unread_count: 3 })
    const { container } = render(<ConversationRailItem conversation={conv} />)

    const dot = container.querySelector(
      '[aria-hidden="true"].rounded-full.bg-primary',
    )
    expect(dot).toBeInTheDocument()
  })

  it('does not show unread indicator when unread_count is 0', () => {
    const conv = makeConversation({ unread_count: 0 })
    const { container } = render(<ConversationRailItem conversation={conv} />)

    const dot = container.querySelector(
      '[aria-hidden="true"].rounded-full.bg-primary',
    )
    expect(dot).not.toBeInTheDocument()
  })

  it('calls onClick with conversation id', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <ConversationRailItem
        conversation={makeConversation()}
        onClick={handleClick}
      />,
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith('conv-1')
  })
})
