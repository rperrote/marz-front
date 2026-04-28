import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import type {
  ConversationDetailResponse,
  MessagesResponse,
} from '#/features/chat/types'

import { MessageBubble } from './MessageBubble'
import { MessageTimeline } from './MessageTimeline'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

// jsdom has no viewport — Virtuoso renders nothing. Mock it as a simple list.
vi.mock('react-virtuoso', () => ({
  // RAFITA:ANY: jsdom mock — react-virtuoso types incompatible with forwardRef in vitest
  Virtuoso: React.forwardRef(function MockVirtuoso(props: any, _ref: any) {
    const { data, itemContent, components } = props
    const Header = components?.Header
    return React.createElement(
      'div',
      { 'data-testid': 'virtuoso-mock' },
      Header ? React.createElement(Header) : null,
      // RAFITA:ANY: jsdom mock — react-virtuoso types incompatible with forwardRef in vitest
      (data ?? []).map((item: any, index: number) =>
        React.createElement('div', { key: index }, itemContent(index, item)),
      ),
    )
  }),
}))

const mockCustomFetch = vi.fn()

vi.mock('#/shared/api/mutator', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function Wrapper({ children }: { children: ReactNode }) {
  const client = createQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function buildMessagesResponse(
  messages: Partial<MessagesResponse['data'][number]>[],
  nextCursor: string | null = null,
): { data: MessagesResponse; status: number } {
  return {
    data: {
      data: messages.map((m, i) => ({
        id: m.id ?? `msg-${i}`,
        conversation_id: 'conv-1',
        author_account_id: m.author_account_id ?? 'acc-other',
        type: m.type ?? 'text',
        text_content: m.text_content ?? `Message ${i}`,
        event_type: null,
        payload: null,
        created_at: m.created_at ?? '2026-04-27T12:00:00Z',
        read_by_self: false,
        ...m,
      })),
      next_before_cursor: nextCursor,
      has_more: nextCursor !== null,
    },
    status: 200,
  }
}

const CONVERSATION_DETAIL_RESPONSE: {
  data: ConversationDetailResponse
  status: number
} = {
  data: {
    data: {
      id: 'conv-1',
      counterpart: {
        kind: 'creator_profile',
        id: 'cp-1',
        display_name: 'María García',
        avatar_url: null,
        handle: 'maria',
        is_active: true,
      },
      presence: { state: 'online', last_seen_at: null },
      can_send: true,
      created_at: '2026-04-01T00:00:00Z',
    },
  },
  status: 200,
}

function mockFetchWithMessages(messagesResponse: {
  data: MessagesResponse
  status: number
}) {
  mockCustomFetch.mockImplementation((url: string) => {
    if (url.includes('/conversations/') && !url.includes('/messages')) {
      return Promise.resolve(CONVERSATION_DETAIL_RESPONSE)
    }
    return Promise.resolve(messagesResponse)
  })
}

beforeEach(() => {
  mockCustomFetch.mockReset()
  mockFetchWithMessages(buildMessagesResponse([]))
})

describe('MessageTimeline', () => {
  it('renders messages from fetched data', async () => {
    mockFetchWithMessages(
      buildMessagesResponse([
        {
          id: 'msg-1',
          text_content: 'Hello world',
          author_account_id: 'acc-other',
          created_at: '2026-04-27T10:00:00Z',
        },
        {
          id: 'msg-2',
          text_content: 'Hi there',
          author_account_id: 'acc-me',
          created_at: '2026-04-27T10:01:00Z',
        },
      ]),
    )

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('shows "Inicio de la conversación" when no more pages', async () => {
    mockFetchWithMessages(
      buildMessagesResponse(
        [
          {
            id: 'msg-1',
            text_content: 'First message',
            created_at: '2026-04-27T10:00:00Z',
          },
        ],
        null,
      ),
    )

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('Inicio de la conversación')).toBeInTheDocument()
    })
  })

  it('shows empty state when no messages exist', async () => {
    mockFetchWithMessages(buildMessagesResponse([]))

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('No hay mensajes todavía')).toBeInTheDocument()
    })
  })

  it('renders day separators between messages on different days', async () => {
    mockFetchWithMessages(
      buildMessagesResponse([
        {
          id: 'msg-1',
          text_content: 'Old msg',
          created_at: '2026-04-20T10:00:00Z',
        },
        {
          id: 'msg-2',
          text_content: 'Today msg',
          created_at: '2026-04-27T10:00:00Z',
        },
      ]),
    )

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('Old msg')).toBeInTheDocument()
    })
    expect(screen.getByText('Today msg')).toBeInTheDocument()
    expect(screen.getAllByRole('separator').length).toBeGreaterThanOrEqual(2)
  })

  it('aligns outgoing messages to the right', async () => {
    mockFetchWithMessages(
      buildMessagesResponse([
        {
          id: 'msg-1',
          text_content: 'My message',
          author_account_id: 'acc-me',
          created_at: '2026-04-27T10:00:00Z',
        },
      ]),
    )

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('My message')).toBeInTheDocument()
    })

    const bubble = screen.getByText('My message').closest('[role="article"]')
    const container = bubble?.parentElement
    expect(container?.className).toContain('justify-end')
  })

  it('renders RequestChangesCard for ChangesRequested system event', async () => {
    mockFetchWithMessages(
      buildMessagesResponse([
        {
          id: 'msg-rc-1',
          type: 'system_event',
          event_type: 'ChangesRequested',
          text_content: null,
          author_account_id: 'acc-other',
          payload: {
            event_type: 'ChangesRequested',
            deliverable_id: 'del-1',
            deliverable_platform: 'youtube',
            deliverable_format: 'long_form',
            deliverable_offer_stage_id: null,
            draft_id: 'draft-1',
            draft_version: 1,
            draft_thumbnail_url: null,
            categories: ['audio'],
            notes: null,
            requested_at: '2026-04-27T12:00:00Z',
            requested_by_account_id: 'acc-other',
          },
          created_at: '2026-04-27T12:00:00Z',
        },
      ]),
    )

    render(
      <Wrapper>
        <MessageTimeline
          conversationId="conv-1"
          currentAccountId="acc-me"
          sessionKind="brand"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('request-changes-card')).toBeInTheDocument()
    })
  })
})

describe('MessageBubble — XSS prevention', () => {
  it('renders script tags as literal text, never as HTML', () => {
    const maliciousText = '<script>alert(1)</script>'

    render(
      <MessageBubble
        direction="in"
        text={maliciousText}
        authorDisplayName="Attacker"
        timestamp="2026-04-27T10:00:00Z"
      />,
    )

    const textElement = screen.getByText('<script>alert(1)</script>')
    expect(textElement).toBeInTheDocument()
    expect(textElement.innerHTML).not.toContain('<script>')
    expect(textElement.textContent).toBe('<script>alert(1)</script>')
  })

  it('renders HTML entities as literal text', () => {
    const htmlText = '<img src=x onerror=alert(1)>'

    render(
      <MessageBubble
        direction="in"
        text={htmlText}
        authorDisplayName="Attacker"
        timestamp="2026-04-27T10:00:00Z"
      />,
    )

    const textElement = screen.getByText(htmlText)
    expect(textElement).toBeInTheDocument()
    expect(textElement.querySelector('img')).toBeNull()
  })
})

describe('MessageBubble — accessibility', () => {
  it('has aria-label with author, time, and preview', () => {
    render(
      <MessageBubble
        direction="in"
        text="Hello world"
        authorDisplayName="María"
        timestamp="2026-04-27T14:30:00Z"
      />,
    )

    const article = screen.getByRole('article')
    const label = article.getAttribute('aria-label')
    expect(label).toContain('María')
    expect(label).toContain('Hello world')
  })

  it('truncates long messages in aria-label to 80 chars', () => {
    const longText = 'A'.repeat(120)

    render(
      <MessageBubble
        direction="out"
        text={longText}
        authorDisplayName="Test"
        timestamp="2026-04-27T14:30:00Z"
      />,
    )

    const article = screen.getByRole('article')
    const label = article.getAttribute('aria-label') ?? ''
    expect(label).toContain('…')
    expect(label.length).toBeLessThan(200)
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <MessageBubble
        direction="in"
        text="Hello"
        authorDisplayName="Test User"
        timestamp="2026-04-27T10:00:00Z"
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
