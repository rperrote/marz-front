import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'

import {
  trackLinkCardSeen,
  trackLinkPreviewResolved,
  trackLinkSubmitOpened,
  trackLinkUrlClicked,
} from './analytics'

function analyticsCalls() {
  return vi
    .mocked(fetch)
    .mock.calls.map((call) => JSON.parse(String(call[1]?.body)) as unknown)
}

describe('deliverables link analytics', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    )
  })

  it('posts link_submit_opened without URLs, titles or account data', async () => {
    trackLinkSubmitOpened({
      deliverable_id: 'del-1',
      platform: 'youtube',
      is_resubmission: true,
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    expect(analyticsCalls()).toEqual([
      {
        event_name: 'link_submit_opened',
        occurred_at: expect.any(String),
        properties: {
          deliverable_id: 'del-1',
          is_resubmission: true,
          platform: 'youtube',
        },
      },
    ])
  })

  it.each(['title_and_thumbnail', 'url_only', 'failed'] as const)(
    'posts link_preview_resolved for %s without sensitive fields',
    async (outcome) => {
      trackLinkPreviewResolved({
        deliverable_id: 'del-1',
        link_id: 'link-1',
        platform: 'youtube',
        outcome,
        is_resubmission: false,
      })

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

      expect(analyticsCalls()[0]).toEqual({
        event_name: 'link_preview_resolved',
        occurred_at: expect.any(String),
        properties: {
          deliverable_id: 'del-1',
          link_id: 'link-1',
          platform: 'youtube',
          outcome,
          is_resubmission: false,
        },
      })
      expect(JSON.stringify(analyticsCalls()[0])).not.toContain('https://')
      expect(JSON.stringify(analyticsCalls()[0])).not.toContain('Launch video')
      expect(JSON.stringify(analyticsCalls()[0])).not.toContain('account')
    },
  )

  it('posts link_card_seen with the exact safe payload', async () => {
    trackLinkCardSeen({
      deliverable_id: 'del-1',
      link_id: 'link-1',
      platform: 'instagram',
      outcome: 'url_only',
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    expect(analyticsCalls()[0]).toEqual({
      event_name: 'link_card_seen',
      occurred_at: expect.any(String),
      properties: {
        deliverable_id: 'del-1',
        link_id: 'link-1',
        platform: 'instagram',
        outcome: 'url_only',
      },
    })
  })

  it('posts link_url_clicked with the exact safe payload', async () => {
    trackLinkUrlClicked({
      deliverable_id: 'del-1',
      link_id: 'link-1',
      platform: 'tiktok',
      outcome: 'failed',
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    expect(analyticsCalls()[0]).toEqual({
      event_name: 'link_url_clicked',
      occurred_at: expect.any(String),
      properties: {
        deliverable_id: 'del-1',
        link_id: 'link-1',
        platform: 'tiktok',
        outcome: 'failed',
      },
    })
  })
})
