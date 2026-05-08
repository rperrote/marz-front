import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { LinkChangesRequestedCard } from '../LinkChangesRequestedCard'
import type { DraftTimelineMessage } from '../../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = [0.5]

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  trigger(entry: Partial<IntersectionObserverEntry>) {
    this.callback(
      [
        {
          isIntersecting: false,
          intersectionRatio: 0,
          target: document.createElement('div'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
          ...entry,
        },
      ],
      this,
    )
  }
}

function buildMessage(): DraftTimelineMessage {
  return {
    id: 'msg-link-changes',
    author_account_id: 'acc-brand',
    event_type: 'LinkChangesRequested',
    payload: {
      snapshot: {
        event_type: 'LinkChangesRequested',
        deliverable_id: 'del-1',
        deliverable_platform: 'youtube',
        deliverable_format: 'long_form',
        deliverable_offer_stage_id: null,
        link: {
          id: 'link-1',
          url: 'https://youtube.com/watch?v=xK93',
          status: 'changes_requested',
          preview: {
            outcome: 'title_and_thumbnail',
            title: 'Launch video',
            thumbnail_url: 'https://example.com/thumb.jpg',
          },
        },
        categories: ['discount_code'],
        notes: 'Add the code in the description.',
        requested_at: '2026-04-27T12:00:00Z',
        requested_by_account_id: 'acc-brand',
      },
    },
    created_at: '2026-04-27T12:00:00Z',
  }
}

describe('LinkChangesRequestedCard', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
    window.sessionStorage.clear()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    )
  })

  it('reuses RequestChangesCard with a link preview', () => {
    const { container } = render(
      <LinkChangesRequestedCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        counterpartDisplayName="Acme Brand"
        sessionKind="creator"
      />,
    )

    expect(screen.getByTestId('request-changes-card')).toBeInTheDocument()
    expect(screen.getByText('Launch video')).toBeInTheDocument()
    expect(screen.getByText('Discount code')).toBeInTheDocument()
    expect(screen.queryByAltText('Draft thumbnail')).not.toBeInTheDocument()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('tracks link_card_seen for the changes-requested link card', async () => {
    render(
      <LinkChangesRequestedCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        counterpartDisplayName="Acme Brand"
        sessionKind="creator"
      />,
    )

    FakeIntersectionObserver.instances[0]?.trigger({
      isIntersecting: true,
      intersectionRatio: 0.5,
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(
      JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)),
    ).toEqual({
      event_name: 'link_card_seen',
      occurred_at: expect.any(String),
      properties: {
        deliverable_id: 'del-1',
        link_id: 'link-1',
        platform: 'youtube',
        outcome: 'title_and_thumbnail',
      },
    })
  })
})
