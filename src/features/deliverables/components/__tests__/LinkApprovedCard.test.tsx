import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LinkApprovedCard } from '../LinkApprovedCard'
import type { DraftTimelineMessage } from '../../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

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
})
