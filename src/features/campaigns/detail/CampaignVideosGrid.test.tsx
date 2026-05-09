import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CampaignVideoListResponse } from '#/shared/api/generated/model'

import { CampaignVideosGrid } from './CampaignVideosGrid'
import { useCampaignVideosQuery } from './videos/useCampaignVideosQuery'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./videos/useCampaignVideosQuery', () => ({
  useCampaignVideosQuery: vi.fn(),
}))

const useCampaignVideosQueryMock = vi.mocked(useCampaignVideosQuery)

beforeEach(() => {
  useCampaignVideosQueryMock.mockReset()
})

describe('CampaignVideosGrid', () => {
  it('shows Clear filters when empty with active filters', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveFilters: true, onClearFilters })

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('shows Invite creators when empty without active participants', async () => {
    const user = userEvent.setup()
    const onInviteCreators = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveParticipants: false, onInviteCreators })

    await user.click(screen.getByRole('button', { name: 'Invite creators' }))
    expect(onInviteCreators).toHaveBeenCalled()
  })

  it('shows View active creators when empty with active participants', async () => {
    const user = userEvent.setup()
    const onInviteCreators = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveParticipants: true, onInviteCreators })

    await user.click(
      screen.getByRole('button', { name: 'View active creators' }),
    )
    expect(onInviteCreators).toHaveBeenCalled()
  })

  it('renders video cards when data is available', () => {
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({
        data: [makeVideo()],
        total_visible: 1,
        next_cursor: null,
      }),
    )

    renderGrid()

    expect(
      screen.getByRole('link', {
        name: 'Open video reviewer for Lumina Studio',
      }),
    ).toHaveAttribute('href', '/campaigns/campaign-1/deliverables/video-1')
    expect(screen.getByText('Unboxing Reel')).toBeInTheDocument()
    expect(screen.getAllByText('Instagram')).toHaveLength(2)
    expect(screen.getByText('In review')).toBeInTheDocument()
  })

  it('requests the next cursor when Load more is clicked', async () => {
    const user = userEvent.setup()
    const onParamsChange = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({
        data: [makeVideo()],
        total_visible: 1,
        next_cursor: 'cursor-2',
      }),
    )

    renderGrid({ params: { limit: 12 }, onParamsChange })

    await user.click(screen.getByRole('button', { name: 'Load more' }))

    expect(onParamsChange).toHaveBeenCalledWith({
      limit: 12,
      cursor: 'cursor-2',
    })
  })
})

function renderGrid(
  props: Partial<Parameters<typeof CampaignVideosGrid>[0]> = {},
) {
  return render(
    <CampaignVideosGrid
      scope={{ type: 'campaign', campaignId: 'campaign-1' }}
      params={{ limit: 24 }}
      hasActiveFilters={false}
      hasActiveParticipants={true}
      onParamsChange={vi.fn()}
      onClearFilters={vi.fn()}
      onInviteCreators={vi.fn()}
      {...props}
    />,
  )
}

function queryResult(data: CampaignVideoListResponse) {
  return {
    data,
    error: null,
    isPending: false,
    isError: false,
  } as ReturnType<typeof useCampaignVideosQuery>
}

function makeVideo(
  overrides: Partial<CampaignVideoListResponse['data'][number]> = {},
): CampaignVideoListResponse['data'][number] {
  return {
    deliverable_id: 'video-1',
    current_draft_id: 'draft-1',
    current_link_id: null,
    reviewer_url: '/campaigns/campaign-1/deliverables/video-1',
    thumbnail_url: null,
    playback_url: null,
    playback_url_expires_at: null,
    status: 'draft_submitted',
    duration_sec: 95,
    platform: 'instagram',
    format: 'Unboxing Reel',
    creator: {
      account_id: 'creator-1',
      profile_id: 'profile-1',
      handle: 'lumina',
      display_name: 'Lumina Studio',
      avatar_url: null,
      tier: null,
      niches: ['Beauty'],
      country: null,
      city: null,
      primary_platform: null,
    },
    submitted_at: '2026-05-09T12:00:00.000Z',
    updated_at: '2026-05-09T12:00:00.000Z',
    ...overrides,
  }
}
