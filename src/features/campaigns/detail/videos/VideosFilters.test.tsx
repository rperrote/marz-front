import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { CampaignParticipantListItem } from '#/shared/api/generated/model'

import {
  VideosFilters,
  hasActiveVideoFilters,
  isCampaignVideoStatus,
} from './VideosFilters'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const creator: CampaignParticipantListItem = {
  participant_id: 'participant-1',
  creator: {
    account_id: 'creator-1',
    profile_id: 'profile-1',
    display_name: 'Lumina Studio',
    handle: 'lumina',
    avatar_url: null,
    preview_url: null,
    niche: null,
    platforms: [{ platform: 'youtube', handle: 'lumina', followers: null }],
  },
  status: 'active',
  platforms: ['youtube'],
  net_deliverables: { completed: 1, expected: 2 },
  last_activity_at: null,
  conversation_id: null,
  actions: {
    open_workspace: false,
    invite_creator: false,
  },
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VideosFilters', () => {
  it('debounces search changes', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    const onParamsChange = vi.fn()

    render(
      <VideosFilters
        params={{}}
        creators={[creator]}
        onParamsChange={onParamsChange}
      />,
    )

    await user.type(
      screen.getByRole('textbox', { name: 'Search videos' }),
      'ugc',
    )

    expect(onParamsChange).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onParamsChange).toHaveBeenCalledWith({ search: 'ugc' })
  })

  it('toggles status chips and clears filters', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    const onParamsChange = vi.fn()

    render(
      <VideosFilters
        params={{
          status: 'draft_submitted',
          platform: 'youtube',
          creator_account_id: 'creator-1',
          search: 'ugc',
        }}
        creators={[creator]}
        onParamsChange={onParamsChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'In review' }))
    expect(onParamsChange).toHaveBeenCalledWith({
      search: 'ugc',
      platform: 'youtube',
      creator_account_id: 'creator-1',
      status: undefined,
    })

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onParamsChange).toHaveBeenLastCalledWith({})
  })

  it('detects active filters and video statuses', () => {
    expect(hasActiveVideoFilters({})).toBe(false)
    expect(hasActiveVideoFilters({ search: '  ' })).toBe(false)
    expect(hasActiveVideoFilters({ platform: 'youtube' })).toBe(true)
    expect(hasActiveVideoFilters({ status: 'paid' })).toBe(true)
    expect(hasActiveVideoFilters({ creator_account_id: 'creator-1' })).toBe(
      true,
    )
    expect(isCampaignVideoStatus('pending')).toBe(true)
    expect(isCampaignVideoStatus('draft_submitted')).toBe(true)
    expect(isCampaignVideoStatus('active')).toBe(false)
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <VideosFilters
        params={{}}
        creators={[creator]}
        onParamsChange={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
