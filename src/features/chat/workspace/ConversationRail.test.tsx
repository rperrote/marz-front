import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ConversationRail } from './ConversationRail'
import type { ConversationListItem, ConversationListResponse } from './types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const mockCustomFetch = vi.fn()

vi.mock('#/shared/api/mutator', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}))

function makeConversation(id: string, name: string): ConversationListItem {
  return {
    id,
    counterpart: {
      kind: 'creator_profile',
      id: `creator-${id}`,
      display_name: name,
      avatar_url: null,
      handle: null,
    },
    last_activity_at: new Date().toISOString(),
    last_message_preview: {
      kind: 'text',
      text: `Message from ${name}`,
      author_is_self: false,
    },
    unread_count: 0,
    needs_reply: false,
    created_at: new Date().toISOString(),
  }
}

function makeResponse(
  items: ConversationListItem[],
  nextCursor: string | null = null,
): { data: ConversationListResponse; status: number } {
  return {
    data: {
      data: items,
      next_cursor: nextCursor,
      total_visible: items.length,
    },
    status: 200,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const defaultSearch = {
  filter: 'all' as const,
  search: undefined,
  campaign_id: undefined,
}

beforeEach(() => {
  mockCustomFetch.mockReset()
})

describe('ConversationRail', () => {
  it('shows loading skeleton initially', () => {
    mockCustomFetch.mockReturnValue(new Promise(() => {}))
    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders conversation items after loading', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      makeResponse([
        makeConversation('1', 'María López'),
        makeConversation('2', 'Juan Pérez'),
      ]),
    )

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText('María López')).toBeInTheDocument()
    })
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders empty slot when no conversations', async () => {
    mockCustomFetch.mockResolvedValueOnce(makeResponse([]))

    render(
      <ConversationRail
        search={defaultSearch}
        emptySlot={<div data-testid="empty">No hay conversaciones</div>}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument()
    })
  })

  it('shows error state with retry button', async () => {
    mockCustomFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('No se pudieron cargar las conversaciones'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('renders list role for accessibility', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      makeResponse([makeConversation('1', 'Test User')]),
    )

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })
})
