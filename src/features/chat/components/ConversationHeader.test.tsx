import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import type { ConversationDetail } from '#/features/chat/types'

import { ConversationHeader } from './ConversationHeader'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function buildConversation(
  overrides?: Partial<ConversationDetail>,
): ConversationDetail {
  return {
    id: 'conv-1',
    counterpart: {
      kind: 'creator_profile',
      id: 'cp-1',
      display_name: 'Luminal Studio',
      avatar_url: null,
      handle: 'luminalstudio',
      is_active: true,
    },
    presence: {
      state: 'online',
      last_seen_at: null,
    },
    can_send: true,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ConversationHeader', () => {
  it('renders display name and handle', () => {
    const conversation = buildConversation()
    render(<ConversationHeader conversation={conversation} />)

    expect(screen.getByText('Luminal Studio')).toBeInTheDocument()
    expect(screen.getByText('@luminalstudio')).toBeInTheDocument()
  })

  it('renders avatar fallback when no avatar_url', () => {
    const conversation = buildConversation()
    render(<ConversationHeader conversation={conversation} />)

    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('renders without crashing when avatar_url is present', () => {
    const conversation = buildConversation({
      counterpart: {
        kind: 'creator_profile',
        id: 'cp-1',
        display_name: 'Luminal Studio',
        avatar_url: 'https://example.com/avatar.jpg',
        handle: 'luminalstudio',
        is_active: true,
      },
    })
    render(<ConversationHeader conversation={conversation} />)

    // Radix Avatar does not render <img> in jsdom; verify fallback is present
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('does not render handle when null', () => {
    const conversation = buildConversation({
      counterpart: {
        kind: 'brand_workspace',
        id: 'bw-1',
        display_name: 'Some Brand',
        avatar_url: null,
        handle: null,
        is_active: true,
      },
    })
    render(<ConversationHeader conversation={conversation} />)

    expect(screen.getByText('Some Brand')).toBeInTheDocument()
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    const conversation = buildConversation()
    render(<ConversationHeader conversation={conversation} />)

    expect(
      screen.getByRole('banner', {
        name: 'Conversation with Luminal Studio',
      }),
    ).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const conversation = buildConversation()
    const { container } = render(
      <ConversationHeader conversation={conversation} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
