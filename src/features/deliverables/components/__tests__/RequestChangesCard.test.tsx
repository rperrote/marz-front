import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { RequestChangesCard } from '../RequestChangesCard'
import type { DraftTimelineMessage } from '../../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockTrackRequestChangesCardSeen = vi.fn()

vi.mock('../../analytics', () => ({
  trackRequestChangesCardSeen: (...args: unknown[]) =>
    mockTrackRequestChangesCardSeen(...args),
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

function buildMessage(
  overrides?: Partial<DraftTimelineMessage>,
): DraftTimelineMessage {
  return {
    id: 'msg-1',
    author_account_id: 'acc-brand',
    event_type: 'ChangesRequested',
    payload: {
      event_type: 'ChangesRequested',
      deliverable_id: 'del-1',
      deliverable_platform: 'youtube',
      deliverable_format: 'long_form',
      deliverable_offer_stage_id: null,
      draft_id: 'draft-1',
      draft_version: 2,
      draft_thumbnail_url: 'https://example.com/thumb.jpg',
      categories: ['product_placement', 'audio'],
      notes: 'Make the logo bigger.',
      requested_at: '2026-04-27T12:00:00Z',
      requested_by_account_id: 'acc-brand',
    },
    created_at: '2026-04-27T12:00:00Z',
    ...overrides,
  }
}

describe('RequestChangesCard', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    FakeIntersectionObserver.instances = []
    mockTrackRequestChangesCardSeen.mockClear()
  })

  it('renders outgoing variant when requested by current user', () => {
    render(
      <RequestChangesCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
      />,
    )

    expect(screen.getByText('Tú')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('Make the logo bigger.')).toBeInTheDocument()
    expect(screen.getByText('Product placement')).toBeInTheDocument()
    expect(screen.getByText('Audio')).toBeInTheDocument()

    const container = screen.getByTestId('request-changes-card')
    expect(container.className).toContain('justify-end')
  })

  it('renders incoming variant when requested by counterpart', () => {
    render(
      <RequestChangesCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        counterpartDisplayName="María García"
      />,
    )

    expect(screen.getByText('María García')).toBeInTheDocument()

    const container = screen.getByTestId('request-changes-card')
    expect(container.className).toContain('justify-start')
  })

  it('shows thumbnail when draft_thumbnail_url is present', () => {
    render(
      <RequestChangesCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
      />,
    )

    const img = screen.getByAltText('Draft thumbnail')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('hides thumbnail when draft_thumbnail_url is null', () => {
    render(
      <RequestChangesCard
        message={buildMessage({
          payload: {
            event_type: 'ChangesRequested',
            deliverable_id: 'del-1',
            deliverable_platform: 'youtube',
            deliverable_format: 'long_form',
            deliverable_offer_stage_id: null,
            draft_id: 'draft-1',
            draft_version: 1,
            draft_thumbnail_url: null,
            categories: [],
            notes: null,
            requested_at: '2026-04-27T12:00:00Z',
            requested_by_account_id: 'acc-brand',
          },
        })}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
      />,
    )

    expect(screen.queryByAltText('Draft thumbnail')).not.toBeInTheDocument()
  })

  it('shows placeholder when notes are empty', () => {
    render(
      <RequestChangesCard
        message={buildMessage({
          payload: {
            event_type: 'ChangesRequested',
            deliverable_id: 'del-1',
            deliverable_platform: 'youtube',
            deliverable_format: 'long_form',
            deliverable_offer_stage_id: null,
            draft_id: 'draft-1',
            draft_version: 1,
            draft_thumbnail_url: null,
            categories: ['other'],
            notes: '',
            requested_at: '2026-04-27T12:00:00Z',
            requested_by_account_id: 'acc-brand',
          },
        })}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
      />,
    )

    expect(screen.getByText('No additional notes')).toBeInTheDocument()
  })

  it('renders nothing when payload is missing draft_version', () => {
    const { container } = render(
      <RequestChangesCard
        message={buildMessage({ payload: {} })}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('tracks seen once for creator viewers after visible debounce', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T12:00:10Z'))
    render(
      <RequestChangesCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        counterpartDisplayName="María García"
        sessionKind="creator"
      />,
    )

    FakeIntersectionObserver.instances[0]?.trigger({
      isIntersecting: true,
      intersectionRatio: 0.5,
    })
    vi.advanceTimersByTime(250)
    FakeIntersectionObserver.instances[0]?.trigger({
      isIntersecting: true,
      intersectionRatio: 1,
    })
    vi.advanceTimersByTime(250)

    expect(mockTrackRequestChangesCardSeen).toHaveBeenCalledTimes(1)
    expect(mockTrackRequestChangesCardSeen).toHaveBeenCalledWith({
      actor_kind: 'creator',
      time_since_request_seconds: 10.25,
    })
  })

  it('does not track seen for brand viewers', () => {
    render(
      <RequestChangesCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        counterpartDisplayName="María García"
        sessionKind="brand"
      />,
    )

    expect(FakeIntersectionObserver.instances).toHaveLength(0)
    expect(mockTrackRequestChangesCardSeen).not.toHaveBeenCalled()
  })
})
