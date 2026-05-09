import { render, screen, within } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { InboxPage } from './InboxPage'
import type { InboxItem, InboxResponse } from './api/inbox'
import { useInboxQuery } from './hooks/useInboxQuery'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('./hooks/useInboxQuery', () => ({
  useInboxQuery: vi.fn(),
}))

const refetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InboxPage', () => {
  it('renders sections with counts and items sorted by occurred_at desc', async () => {
    mockInboxQuery({
      data: makeInboxResponse({
        action_items: [
          makeInboxItem({
            id: 'old-action',
            title: 'Old action',
            occurred_at: '2026-05-08T10:00:00Z',
            meta: {
              primary: 'Old Creator',
              secondary: 'Campaign A',
              timestamp: 'ayer',
            },
          }),
          makeInboxItem({
            id: 'new-action',
            title: 'New action',
            occurred_at: '2026-05-09T10:00:00Z',
            meta: {
              primary: 'New Creator',
              secondary: 'Campaign B',
              timestamp: 'hoy',
            },
            counterpart: {
              account_id: 'account-new',
              display_name: 'New Creator',
              avatar_url: 'https://cdn.test/avatar.png',
            },
          }),
        ],
        waiting_items: [
          makeInboxItem({
            id: 'waiting',
            section: 'waiting',
            title: 'Waiting item',
            occurred_at: '2026-05-07T10:00:00Z',
          }),
        ],
        counts: { action: 2, waiting: 1 },
      }),
    })

    renderInboxPage()

    expect(
      await screen.findByRole('heading', { name: 'Action items' }),
    ).toBeInTheDocument()
    expect(useInboxQuery).toHaveBeenCalledWith({ campaignId: undefined })
    expect(
      screen.getByRole('heading', { name: 'Waiting on others' }),
    ).toBeInTheDocument()

    const actionSection = screen
      .getByRole('heading', { name: 'Action items' })
      .closest('section')
    expect(actionSection).not.toBeNull()
    expect(within(actionSection!).getByText('2')).toBeInTheDocument()

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('New action')
    expect(rows[1]).toHaveTextContent('Old action')
    expect(rows[2]).toHaveTextContent('Waiting item')
  })

  it('renders unified empty state when both counts are zero', async () => {
    mockInboxQuery({
      data: makeInboxResponse({
        action_items: [],
        waiting_items: [],
        counts: { action: 0, waiting: 0 },
        empty_state: {
          visible: true,
          title: 'Estás al día',
          description: 'No tenés nada pendiente.',
          primary_cta: {
            type: 'open_discovery',
            label: 'Browse Discovery',
            href: '/discovery',
          },
          secondary_cta: {
            type: 'open_campaign',
            label: 'Open campaigns',
            href: '/campaigns',
          },
        },
      }),
    })

    renderInboxPage()

    expect(
      await screen.findByRole('heading', { name: 'Estás al día' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No tenés nada pendiente.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Action items' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Browse Discovery/i }),
    ).toHaveAttribute('href', '/discovery')
    expect(
      screen.getByRole('link', { name: /Open campaigns/i }),
    ).toHaveAttribute('href', '/campaigns')
  })

  it('renders recoverable error state', async () => {
    mockInboxQuery({ isError: true })

    renderInboxPage()

    expect(
      await screen.findByRole('heading', {
        name: 'No se pudo cargar el inbox',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})

function mockInboxQuery({
  data,
  isLoading = false,
  isError = false,
}: {
  data?: InboxResponse
  isLoading?: boolean
  isError?: boolean
}) {
  vi.mocked(useInboxQuery).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as unknown as ReturnType<typeof useInboxQuery>)
}

function renderInboxPage() {
  const rootRoute = createRootRoute({
    component: Outlet,
  })
  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: InboxPage,
  })
  const discoveryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/discovery',
    component: () => null,
  })
  const campaignsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/campaigns',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      inboxRoute,
      discoveryRoute,
      campaignsRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router} />)
}

function makeInboxResponse(
  overrides: Partial<InboxResponse> = {},
): InboxResponse {
  return {
    account_kind: 'brand',
    campaign_id: null,
    action_items: [makeInboxItem()],
    waiting_items: [],
    counts: { action: 1, waiting: 0 },
    campaign_filter_options: [],
    empty_state: {
      visible: false,
      title: 'Estás al día',
      description: 'No hay items pendientes.',
      primary_cta: null,
      secondary_cta: null,
    },
    generated_at: '2026-05-09T10:00:00Z',
    ...overrides,
  }
}

function makeInboxItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: 'item-1',
    section: 'action',
    kind: 'message_reply',
    status: 'pending',
    campaign: { id: 'campaign-1', name: 'Campaign' },
    counterpart: {
      account_id: 'account-1',
      display_name: 'Ana Creator',
      avatar_url: null,
    },
    meta: {
      primary: 'Ana Creator',
      secondary: 'Campaign',
      timestamp: '2h',
    },
    title: 'Needs your answer',
    preview: 'Preview text',
    occurred_at: '2026-05-09T09:00:00Z',
    action_url: null,
    source_ref: {
      type: 'conversation',
      id: 'conversation-1',
    },
    secondary_ref: null,
    counterpart_account_id: 'account-1',
    counterpart_display_name: 'Ana Creator',
    counterpart_avatar_url: null,
    inline_actions: [],
    navigation_action: null,
    can_mark_read: true,
    ...overrides,
  }
}
