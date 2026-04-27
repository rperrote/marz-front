import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { DeliverableListPanel } from '../DeliverableListPanel'
import type {
  ConversationDeliverablesResponse,
  DeliverableDTO,
} from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockUseGetConversationDeliverablesQuery = vi.fn()

vi.mock('#/features/deliverables/api/conversationDeliverables', () => ({
  useGetConversationDeliverablesQuery: (...args: unknown[]) =>
    mockUseGetConversationDeliverablesQuery(...args),
}))

vi.mock('../UploadDraftDialog', () => ({
  UploadDraftDialog: () => <div data-testid="upload-draft-dialog" />,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderPanel(
  props?: Partial<Parameters<typeof DeliverableListPanel>[0]>,
) {
  return render(
    <DeliverableListPanel
      conversationId="conv-1"
      sessionKind="creator"
      {...props}
    />,
    { wrapper: createWrapper() },
  )
}

function makeResponse(
  overrides?: Partial<ConversationDeliverablesResponse>,
): ConversationDeliverablesResponse {
  return {
    offer_id: 'offer-1',
    offer_type: 'single',
    deliverables: [],
    stages: [],
    ...overrides,
  }
}

function makeDeliverable(overrides?: Partial<DeliverableDTO>): DeliverableDTO {
  return {
    id: 'del-1',
    offer_id: 'offer-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'Video',
    status: 'pending',
    deadline: '2026-05-01',
    current_version: 1,
    current_draft: null,
    drafts_count: 1,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('DeliverableListPanel', () => {
  beforeEach(() => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
  })

  it('shows empty state when offer_id is null', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({ offer_id: null, offer_type: null }),
      isLoading: false,
    })

    renderPanel()

    expect(screen.getByText(/no active offer yet/i)).toBeInTheDocument()
  })

  it('renders single offer with one deliverable', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({
        offer_type: 'single',
        deliverables: [makeDeliverable({ id: 'del-1', status: 'pending' })],
      }),
      isLoading: false,
    })

    renderPanel()

    expect(screen.getByText('Video')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /upload draft/i }),
    ).toBeInTheDocument()
  })

  it('renders bundle offer with three flat deliverables', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({
        offer_type: 'bundle',
        deliverables: [
          makeDeliverable({ id: 'del-1', status: 'pending' }),
          makeDeliverable({ id: 'del-2', status: 'draft_submitted' }),
          makeDeliverable({ id: 'del-3', status: 'draft_approved' }),
        ],
      }),
      isLoading: false,
    })

    renderPanel()

    expect(screen.getAllByText('Video')).toHaveLength(3)
  })

  it('renders multistage with two groups and disables locked stage upload', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({
        offer_type: 'multistage',
        deliverables: [
          makeDeliverable({ id: 'del-1', status: 'pending' }),
          makeDeliverable({ id: 'del-2', status: 'pending' }),
        ],
        stages: [
          {
            id: 'stage-1',
            position: 1,
            name: 'Stage 1',
            deadline: '2026-05-01',
            status: 'open',
            deliverable_ids: ['del-1'],
          },
          {
            id: 'stage-2',
            position: 2,
            name: 'Stage 2',
            deadline: '2026-06-01',
            status: 'locked',
            deliverable_ids: ['del-2'],
          },
        ],
      }),
      isLoading: false,
    })

    renderPanel()

    expect(screen.getByText('Stage 1')).toBeInTheDocument()
    expect(screen.getByText('Stage 2')).toBeInTheDocument()

    // Open stage should have enabled upload button
    const buttons = screen.getAllByRole('button')
    const uploadButtons = buttons.filter((b) =>
      b.textContent.includes('Upload draft'),
    )
    expect(uploadButtons).toHaveLength(1)

    // Locked stage should show disabled upload draft text (not a button)
    expect(screen.getAllByText('Upload draft')).toHaveLength(2)
  })

  it('does not show upload draft button for brand session', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({
        offer_type: 'single',
        deliverables: [makeDeliverable({ id: 'del-1', status: 'pending' })],
      }),
      isLoading: false,
    })

    renderPanel({ sessionKind: 'brand' })

    expect(
      screen.queryByRole('button', { name: /upload draft/i }),
    ).not.toBeInTheDocument()
  })

  it('opens upload dialog when upload draft is clicked', async () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: makeResponse({
        offer_type: 'single',
        deliverables: [makeDeliverable({ id: 'del-1', status: 'pending' })],
      }),
      isLoading: false,
    })

    renderPanel()

    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: /upload draft/i })
    await user.click(button)

    expect(screen.getByTestId('upload-draft-dialog')).toBeInTheDocument()
  })

  it('shows loading skeleton while loading', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    renderPanel()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
