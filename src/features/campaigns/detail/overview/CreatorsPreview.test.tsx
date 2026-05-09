import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { CampaignCreatorPreview } from '#/shared/api/generated/model'

import { CreatorsPreview } from './CreatorsPreview'

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

describe('CreatorsPreview', () => {
  it('renders creators from the overview payload', () => {
    render(
      <CreatorsPreview campaignId="campaign-1" creators={[makeCreator()]} />,
    )

    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('@ana · Instagram')).toBeInTheDocument()
    expect(screen.getByText('1/3 entregables')).toBeInTheDocument()
  })

  it('shows empty state CTA to Discovery when there are no creators', () => {
    render(<CreatorsPreview campaignId="campaign-1" creators={[]} />)

    expect(
      screen.getByRole('heading', {
        name: /todavía no hay creators participantes/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /ir a discovery/i }),
    ).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CreatorsPreview campaignId="campaign-1" creators={[makeCreator()]} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

function makeCreator(): CampaignCreatorPreview {
  return {
    status: 'accepted',
    source: 'application',
    first_joined_at: '2026-05-01T10:00:00Z',
    last_activity_at: null,
    conversation_id: null,
    latest_offer_id: null,
    deliverables_expected: 3,
    deliverables_completed: 1,
    current_platforms: ['instagram'],
    creator: {
      account_id: 'creator-1',
      profile_id: 'profile-1',
      handle: 'ana',
      display_name: 'Ana García',
      avatar_url: null,
      tier: 'pro',
      niches: ['beauty'],
      country: 'AR',
      city: 'Buenos Aires',
      primary_platform: {
        platform: 'instagram',
        external_handle: 'ana',
        external_url: null,
        followers: 12000,
        verified: false,
      },
    },
  }
}
