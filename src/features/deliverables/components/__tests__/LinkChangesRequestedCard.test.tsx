import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
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
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
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
})
