import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LinkApprovedCard } from '../LinkApprovedCard'
import type { DraftTimelineMessage, DeliverableStatus } from '../../types'

const mockUseGetConversationDeliverablesQuery = vi.fn()

vi.mock('#/features/deliverables/api/conversationDeliverables', () => ({
  useGetConversationDeliverablesQuery: (...args: unknown[]) =>
    mockUseGetConversationDeliverablesQuery(...args),
}))

function mockDeliverable(status: DeliverableStatus) {
  mockUseGetConversationDeliverablesQuery.mockReturnValue({
    data: { deliverables: [{ id: 'del-1', status }] },
  })
}

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
    id: 'msg-link-approved',
    author_account_id: 'acc-brand',
    event_type: 'LinkApproved',
    payload: {
      snapshot: {
        event_type: 'LinkApproved',
        deliverable_id: 'del-1',
        deliverable_platform: 'youtube',
        deliverable_format: 'long_form',
        deliverable_offer_stage_id: null,
        link: {
          id: 'link-1',
          url: 'https://youtube.com/watch?v=xK93',
          status: 'approved',
          preview: { outcome: 'url_only' },
        },
        approved_at: '2026-04-27T12:00:00Z',
        approved_by_account_id: 'acc-brand',
      },
    },
    created_at: '2026-04-27T12:00:00Z',
  }
}

describe('LinkApprovedCard', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
    window.sessionStorage.clear()
    mockUseGetConversationDeliverablesQuery.mockReset()
    mockDeliverable('completed')
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    )
  })

  it('renders success fallback with a clickable URL', () => {
    const { container } = render(
      <LinkApprovedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
      />,
    )

    expect(screen.getByTestId('link-approved-card')).toBeInTheDocument()
    expect(screen.getByText('Link approved')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'https://youtube.com/watch?v=xK93' }),
    ).toHaveAttribute('href', 'https://youtube.com/watch?v=xK93')
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders nothing for invalid payloads', () => {
    const { container } = render(
      <LinkApprovedCard
        message={{ ...buildMessage(), payload: {} }}
        currentAccountId="acc-brand"
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('tracks link_card_seen for the approved card', async () => {
    render(
      <LinkApprovedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
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
        outcome: 'url_only',
      },
    })
  })

  describe('mark as paid action', () => {
    it.each([
      ['brand owner', { kind: 'brand' as const, role: 'owner' as const }, true],
      [
        'brand member',
        { kind: 'brand' as const, role: 'member' as const },
        false,
      ],
      [
        'brand admin',
        { kind: 'brand' as const, role: 'admin' as const },
        false,
      ],
      ['creator', { kind: 'creator' as const, role: undefined }, false],
    ])(
      'shows Mark as paid for %s only when allowed',
      (_label, viewer, visible) => {
        render(
          <LinkApprovedCard
            message={buildMessage()}
            currentAccountId="acc-brand"
            conversationId="conv-1"
            viewer={viewer}
          />,
        )
        const button = screen.queryByRole('button', { name: /mark as paid/i })
        expect(Boolean(button)).toBe(visible)
      },
    )

    it('hides Mark as paid when the deliverable is already paid', () => {
      mockDeliverable('paid')
      render(
        <LinkApprovedCard
          message={buildMessage()}
          currentAccountId="acc-brand"
          conversationId="conv-1"
          viewer={{ kind: 'brand', role: 'owner' }}
        />,
      )
      expect(
        screen.queryByRole('button', { name: /mark as paid/i }),
      ).not.toBeInTheDocument()
    })

    it('calls onMarkAsPaid with the correct deliverable id', async () => {
      const user = userEvent.setup()
      const onMarkAsPaid = vi.fn()
      render(
        <LinkApprovedCard
          message={buildMessage()}
          currentAccountId="acc-brand"
          conversationId="conv-1"
          viewer={{ kind: 'brand', role: 'owner' }}
          onMarkAsPaid={onMarkAsPaid}
        />,
      )
      await user.click(screen.getByRole('button', { name: /mark as paid/i }))
      expect(onMarkAsPaid).toHaveBeenCalledWith('del-1')
    })
  })
})
