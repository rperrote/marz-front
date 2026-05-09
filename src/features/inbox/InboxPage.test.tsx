import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { InboxPage } from './InboxPage'
import type { InboxItem, InboxResponse } from './api/inbox'
import { useInboxQuery } from './hooks/useInboxQuery'
import { useMarkInboxItemReadMutation } from './hooks/useMarkInboxItemReadMutation'
import { useMarkInboxVisibleReadMutation } from './hooks/useMarkInboxVisibleReadMutation'
import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('./hooks/useInboxQuery', () => ({
  useInboxQuery: vi.fn(),
}))

vi.mock('./hooks/useMarkInboxItemReadMutation', () => ({
  useMarkInboxItemReadMutation: vi.fn(),
}))

vi.mock('./hooks/useMarkInboxVisibleReadMutation', () => ({
  useMarkInboxVisibleReadMutation: vi.fn(),
}))

const refetch = vi.fn()
const markItemReadMutate = vi.fn()
const markVisibleReadMutate = vi.fn()
const campaignId = '018f2f3a-1f2b-7c8d-9e0f-123456789abc'
const otherCampaignId = '018f2f3a-1f2b-7c8d-9e0f-abcdefabcdef'

beforeEach(() => {
  vi.clearAllMocks()
  resetTrackedEvents()
  vi.mocked(useMarkInboxItemReadMutation).mockReturnValue({
    mutate: markItemReadMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useMarkInboxItemReadMutation>)
  vi.mocked(useMarkInboxVisibleReadMutation).mockReturnValue({
    mutate: markVisibleReadMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useMarkInboxVisibleReadMutation>)
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
    await waitFor(() => {
      expect(getTrackedEvents().map((event) => event.event)).toContain(
        'inbox_empty_viewed',
      )
    })
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

  it('updates campaign_id search and refetches through the campaign query key', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse({
        campaign_filter_options: [
          {
            campaign_id: campaignId,
            campaign_name: 'Campaign A',
            pending_action_count: 1,
            pending_waiting_count: 0,
          },
        ],
      }),
    })
    const { router } = renderInboxPage()

    await user.click(
      await screen.findByRole('combobox', { name: 'Filtrar por campaña' }),
    )
    await user.click(await screen.findByRole('option', { name: 'Campaign A' }))

    expect(router.state.location.search).toEqual({
      campaign_id: campaignId,
    })
    expect(useInboxQuery).toHaveBeenLastCalledWith({ campaignId })
    expect(getTrackedEvents()).toContainEqual(
      expect.objectContaining({
        event: 'inbox_filter_changed',
        payload: {
          account_kind: 'brand',
          campaign_id: campaignId,
          has_campaign_filter: true,
        },
      }),
    )
  })

  it('removes campaign_id search when All campaigns is selected', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse({
        campaign_id: campaignId,
        campaign_filter_options: [
          {
            campaign_id: campaignId,
            campaign_name: 'Campaign A',
            pending_action_count: 1,
            pending_waiting_count: 0,
          },
        ],
      }),
    })
    const { router } = renderInboxPage(`/inbox?campaign_id=${campaignId}`)

    await screen.findByRole('heading', { name: 'Inbox' })
    expect(useInboxQuery).toHaveBeenLastCalledWith({ campaignId })

    await user.click(
      screen.getByRole('combobox', { name: 'Filtrar por campaña' }),
    )
    await user.click(screen.getByRole('option', { name: 'All campaigns' }))

    expect(router.state.location.search).toEqual({})
    expect(useInboxQuery).toHaveBeenLastCalledWith({ campaignId: undefined })
  })

  it('marks all as read with the current campaign id', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse({
        campaign_id: campaignId,
        campaign_filter_options: [
          {
            campaign_id: campaignId,
            campaign_name: 'Campaign A',
            pending_action_count: 1,
            pending_waiting_count: 0,
          },
          {
            campaign_id: otherCampaignId,
            campaign_name: 'Campaign B',
            pending_action_count: 0,
            pending_waiting_count: 2,
          },
        ],
      }),
    })
    renderInboxPage(`/inbox?campaign_id=${campaignId}`)

    await user.click(
      await screen.findByRole('button', { name: 'Mark all as read' }),
    )

    expect(markVisibleReadMutate).toHaveBeenCalledWith(
      {
        campaign_id: campaignId,
        sections: undefined,
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('refresh invalidates inbox queries', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse(),
    })
    const { queryClient } = renderInboxPage()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(
      await screen.findByRole('button', { name: 'Refresh inbox' }),
    )

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inbox'] })
    expect(getTrackedEvents()).toContainEqual(
      expect.objectContaining({
        event: 'inbox_refreshed',
        payload: {
          account_kind: 'brand',
          campaign_id: null,
        },
      }),
    )
  })

  it('navigates to the backend navigation_action href and tracks opened without PII', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse({
        action_items: [
          makeInboxItem({
            navigation_action: {
              type: 'open_conversation',
              label: 'Open conversation',
              href: '/workspace/conversations/conversation-1',
            },
          }),
        ],
      }),
    })
    const { router } = renderInboxPage()

    await user.click(
      await screen.findByRole('link', { name: 'Open conversation' }),
    )

    expect(router.state.location.pathname).toBe(
      '/workspace/conversations/conversation-1',
    )
    expect(getTrackedEvents()).toContainEqual(
      expect.objectContaining({
        event: 'inbox_item_opened',
        payload: {
          account_kind: 'brand',
          campaign_id: 'campaign-1',
          item_kind: 'message_reply',
          section: 'action',
          navigation_type: 'open_conversation',
        },
      }),
    )
    const openedEvent = getTrackedEvents().find(
      (event) => event.event === 'inbox_item_opened',
    )
    expect(openedEvent?.payload).not.toHaveProperty('preview')
    expect(openedEvent?.payload).not.toHaveProperty('display_name')
    expect(openedEvent?.payload).not.toHaveProperty('avatar_url')
  })

  it('shows a neutral toast when navigation_action href is not routed', async () => {
    const user = userEvent.setup()
    mockInboxQuery({
      data: makeInboxResponse({
        action_items: [
          makeInboxItem({
            navigation_action: {
              type: 'open_video_reviewer',
              label: 'Review video',
              href: '/deliverables/deliverable-1/review',
            },
          }),
        ],
      }),
    })
    const { toast } = await import('sonner')
    const { router } = renderInboxPage()

    await user.click(await screen.findByRole('link', { name: 'Review video' }))

    expect(router.state.location.pathname).toBe('/inbox')
    expect(toast.info).toHaveBeenCalledWith(
      'Esta sección todavía no está disponible.',
    )
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

function renderInboxPage(initialEntry = '/inbox') {
  const rootRoute = createRootRoute({
    component: Outlet,
  })
  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    validateSearch: (search: Record<string, unknown>) => ({
      campaign_id:
        typeof search.campaign_id === 'string' ? search.campaign_id : undefined,
    }),
    component: function TestInboxRoute() {
      const search = inboxRoute.useSearch()
      return <InboxPage campaignId={search.campaign_id} />
    },
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
  const conversationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspace/conversations/$conversationId',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      inboxRoute,
      discoveryRoute,
      campaignsRoute,
      conversationRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
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
