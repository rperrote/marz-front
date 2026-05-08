import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import { LinkSubmittedCard } from '../LinkSubmittedCard'
import type { DraftTimelineMessage } from '../../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockUseMe = vi.fn()
const mockApproveLinkMutate = vi.fn()

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

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => mockUseMe(),
}))

vi.mock('#/features/deliverables/hooks/useApproveLink', () => ({
  useApproveLink: () => ({
    mutate: mockApproveLinkMutate,
    isPending: false,
  }),
}))

vi.mock('../RequestChangesModal', () => ({
  RequestChangesModal: ({ trigger }: { trigger: ReactNode }) => trigger,
}))

function buildMessage(status = 'submitted'): DraftTimelineMessage {
  return {
    id: 'msg-link-1',
    author_account_id: 'acc-creator',
    event_type: 'LinkSubmitted',
    payload: {
      snapshot: {
        event_type: 'LinkSubmitted',
        deliverable_id: 'del-1',
        deliverable_platform: 'youtube',
        deliverable_format: 'long_form',
        deliverable_offer_stage_id: null,
        link: {
          id: 'link-1',
          url: 'https://youtube.com/watch?v=xK93',
          status,
          preview: { outcome: 'url_only' },
          submitted_at: '2026-04-27T12:00:00Z',
          submitted_by_account_id: 'acc-creator',
        },
        message: 'Just published! Sharing the link here.',
      },
    },
    created_at: '2026-04-27T12:00:00Z',
  }
}

function mockViewer(role: 'owner' | 'admin' | 'member') {
  mockUseMe.mockReturnValue({
    data: {
      status: 200,
      data: {
        id: 'acc-brand',
        kind: 'brand',
        brand_memberships: [{ brand_workspace_id: 'brand-ws-1', role }],
      },
    },
  })
}

describe('LinkSubmittedCard', () => {
  beforeEach(() => {
    mockViewer('owner')
    mockApproveLinkMutate.mockClear()
    FakeIntersectionObserver.instances = []
    window.sessionStorage.clear()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    )
  })

  it('shows link actions only for brand owners when the link is submitted', () => {
    const { container } = render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Approve link' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Request changes on link' }),
    ).toBeInTheDocument()
    expect(container.firstChild).toMatchSnapshot()
  })

  it.each(['admin', 'member'] as const)(
    'hides link actions for brand %s viewers',
    (role) => {
      mockViewer(role)
      const { container } = render(
        <LinkSubmittedCard
          message={buildMessage()}
          currentAccountId="acc-brand"
          brandWorkspaceId="brand-ws-1"
          sessionKind="brand"
        />,
      )

      expect(
        screen.queryByRole('button', { name: 'Approve link' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Request changes on link' }),
      ).not.toBeInTheDocument()
      expect(container.firstChild).toMatchSnapshot()
    },
  )

  it('hides link actions for creator viewers', () => {
    const { container } = render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-creator"
        brandWorkspaceId="brand-ws-1"
        sessionKind="creator"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Approve link' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Request changes on link' }),
    ).not.toBeInTheDocument()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('hides link actions when the link status is not submitted', () => {
    render(
      <LinkSubmittedCard
        message={buildMessage('approved')}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Approve link' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Request changes on link' }),
    ).not.toBeInTheDocument()
  })

  it('calls action callbacks without mutating itself', async () => {
    const user = userEvent.setup()
    const onApproveLink = vi.fn()
    const onRequestChangesOnLink = vi.fn()

    render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
        onApproveLink={onApproveLink}
        onRequestChangesOnLink={onRequestChangesOnLink}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Approve link' }))
    await user.click(
      screen.getByRole('button', { name: 'Request changes on link' }),
    )

    expect(onApproveLink).toHaveBeenCalledTimes(1)
    expect(onRequestChangesOnLink).toHaveBeenCalledTimes(1)
    expect(mockApproveLinkMutate).not.toHaveBeenCalled()
  })

  it('approves link with the wired mutation when no callback is provided', async () => {
    const user = userEvent.setup()

    render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Approve link' }))

    expect(mockApproveLinkMutate).toHaveBeenCalledTimes(1)
  })

  it('hides link actions when owner membership belongs to another workspace', () => {
    mockUseMe.mockReturnValue({
      data: {
        status: 200,
        data: {
          id: 'acc-brand',
          kind: 'brand',
          brand_memberships: [
            { brand_workspace_id: 'brand-ws-1', role: 'owner' },
            { brand_workspace_id: 'brand-ws-2', role: 'member' },
          ],
        },
      },
    })

    render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-2"
        sessionKind="brand"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Approve link' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Request changes on link' }),
    ).not.toBeInTheDocument()
  })

  it('tracks link_card_seen once per session by link id', async () => {
    const { unmount } = render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
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

    unmount()
    render(
      <LinkSubmittedCard
        message={buildMessage()}
        currentAccountId="acc-brand"
        brandWorkspaceId="brand-ws-1"
        sessionKind="brand"
      />,
    )

    FakeIntersectionObserver.instances[1]?.trigger({
      isIntersecting: true,
      intersectionRatio: 1,
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(window.sessionStorage.getItem('link_card_seen:link-1')).toBe('1')
  })
})
