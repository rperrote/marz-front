import { render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { CampaignActivityItem } from '#/shared/api/generated/model'

import { RecentActivity } from './RecentActivity'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params: _params,
    search: _search,
    to,
    ...props
  }: ComponentProps<'a'> & {
    to: string
    params?: unknown
    search?: unknown
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('RecentActivity', () => {
  it('sorts activity by occurred_at desc and limits to five items', () => {
    render(
      <RecentActivity
        campaignId="campaign-1"
        activity={[
          makeActivity('1', 'Oldest', '2026-05-01T10:00:00Z'),
          makeActivity('2', 'Second', '2026-05-02T10:00:00Z'),
          makeActivity('3', 'Third', '2026-05-03T10:00:00Z'),
          makeActivity('4', 'Fourth', '2026-05-04T10:00:00Z'),
          makeActivity('5', 'Fifth', '2026-05-05T10:00:00Z'),
          makeActivity('6', 'Newest', '2026-05-06T10:00:00Z'),
        ]}
      />,
    )

    const items = within(screen.getByRole('list')).getAllByRole('listitem')

    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('Newest')
    expect(items[4]).toHaveTextContent('Second')
    expect(screen.queryByText('Oldest')).not.toBeInTheDocument()
  })

  it('shows empty state CTA to creators when there is no activity', () => {
    render(<RecentActivity campaignId="campaign-1" activity={[]} />)

    expect(
      screen.getByRole('heading', {
        name: /todavía no hay actividad reciente/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /ver creators/i }),
    ).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <RecentActivity
        campaignId="campaign-1"
        activity={[makeActivity('1', 'Activity', '2026-05-01T10:00:00Z')]}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

function makeActivity(
  id: string,
  title: string,
  occurredAt: string,
): CampaignActivityItem {
  return {
    id,
    title,
    occurred_at: occurredAt,
    body: null,
    source: 'application',
    source_ref_type: 'application',
    source_ref_id: id,
    actor_account_id: null,
    creator_account_id: null,
  }
}
