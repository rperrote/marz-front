import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { DraftSubmittedCard } from '../DraftSubmittedCard'
import type {
  DraftTimelineMessage,
  ConversationDeliverablesResponse,
} from '../../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
}

// @ts-expect-error jsdom missing IntersectionObserver
window.IntersectionObserver = MockIntersectionObserver

vi.mock('../InlineVideoPlayer', () => ({
  InlineVideoPlayer: () => <div data-testid="inline-video-player" />,
}))

vi.mock('../ApproveDraftButton', () => ({
  ApproveDraftButton: () => (
    <button data-testid="approve-draft-button">Approve draft</button>
  ),
}))

vi.mock('../RequestChangesModal', () => ({
  RequestChangesModal: ({ trigger }: { trigger?: ReactNode }) => (
    <div data-testid="request-changes-modal">{trigger}</div>
  ),
}))

const mockUseQuery = vi.fn()

vi.mock('../../api/conversationDeliverables', () => ({
  useGetConversationDeliverablesQuery: (conversationId: string) =>
    mockUseQuery(conversationId),
}))

vi.mock('../../analytics', () => ({
  trackDraftSubmittedCardSeen: vi.fn(),
}))

function buildMessage(
  overrides?: Partial<DraftTimelineMessage>,
): DraftTimelineMessage {
  return {
    id: 'msg-1',
    author_account_id: 'acc-creator',
    event_type: 'DraftSubmitted',
    payload: {
      event_type: 'DraftSubmitted',
      deliverable_id: 'del-1',
      deliverable_platform: 'youtube',
      deliverable_format: 'long_form',
      deliverable_offer_stage_id: null,
      draft_id: 'draft-1',
      version: 1,
      original_filename: 'video.mp4',
      file_size_bytes: 1024 * 1024 * 10,
      duration_sec: 120,
      mime_type: 'video/mp4',
      thumbnail_url: null,
      playback_url: 'https://example.com/video.mp4',
      playback_url_expires_at: '2026-04-27T12:00:00Z',
      submitted_at: '2026-04-27T12:00:00Z',
      submitted_by_account_id: 'acc-creator',
    },
    created_at: '2026-04-27T12:00:00Z',
    ...overrides,
  }
}

function mockDeliverablesResponse(
  status: string,
  currentVersion: number | null,
): { data: ConversationDeliverablesResponse } {
  return {
    data: {
      offer_id: 'offer-1',
      offer_type: 'single',
      deliverables: [
        {
          id: 'del-1',
          offer_id: 'offer-1',
          offer_stage_id: null,
          platform: 'youtube',
          format: 'long_form',
          status:
            status as ConversationDeliverablesResponse['deliverables'][number]['status'],
          deadline: null,
          current_version: currentVersion,
          current_draft: null,
          drafts_count: 1,
          created_at: '2026-04-27T12:00:00Z',
          updated_at: '2026-04-27T12:00:00Z',
        },
      ],
      stages: [],
    },
  }
}

describe('DraftSubmittedCard', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined })
  })

  it('shows request changes button for brand when status is draft_submitted and version is current', () => {
    mockUseQuery.mockReturnValue(mockDeliverablesResponse('draft_submitted', 1))

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    expect(
      screen.getByRole('button', { name: /request changes/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /request changes/i }),
    ).not.toHaveAttribute('disabled')
  })

  it('hides request changes button for creator session', () => {
    mockUseQuery.mockReturnValue(mockDeliverablesResponse('draft_submitted', 1))

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        counterpartDisplayName="Acme Brand"
        conversationId="conv-1"
        sessionKind="creator"
      />,
    )

    expect(
      screen.queryByRole('button', { name: /request changes/i }),
    ).not.toBeInTheDocument()
  })

  it('hides request changes button when status is changes_requested', () => {
    mockUseQuery.mockReturnValue(
      mockDeliverablesResponse('changes_requested', 1),
    )

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    expect(
      screen.queryByRole('button', { name: /request changes/i }),
    ).not.toBeInTheDocument()
  })

  it('hides request changes button when status is draft_approved', () => {
    mockUseQuery.mockReturnValue(mockDeliverablesResponse('draft_approved', 1))

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    expect(
      screen.queryByRole('button', { name: /request changes/i }),
    ).not.toBeInTheDocument()
  })

  it('disables request changes button with tooltip when version is stale', () => {
    mockUseQuery.mockReturnValue(mockDeliverablesResponse('draft_submitted', 2))

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    const button = screen.getByRole('button', { name: /request changes/i })
    expect(button).toHaveAttribute('disabled')
    expect(button).toHaveAttribute(
      'aria-describedby',
      'request-changes-tooltip-del-1',
    )
    expect(
      screen.getByText('A newer version was submitted'),
    ).toBeInTheDocument()
  })

  it('shows enabled request changes button when current_version is null and status is draft_submitted', () => {
    // When backend returns current_version: null, the card defaults to
    // snapshot.version as the resolved current version, so isStale is false.
    // The button should appear enabled (not disabled) in this case.
    mockUseQuery.mockReturnValue(
      mockDeliverablesResponse('draft_submitted', null),
    )

    render(
      <DraftSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    const button = screen.getByRole('button', { name: /request changes/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toHaveAttribute('disabled')
  })

  it('renders nothing when payload is invalid', () => {
    const { container } = render(
      <DraftSubmittedCard
        message={buildMessage({ payload: {} })}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        conversationId="conv-1"
        sessionKind="brand"
      />,
    )

    expect(container.firstChild).toBeNull()
  })
})
