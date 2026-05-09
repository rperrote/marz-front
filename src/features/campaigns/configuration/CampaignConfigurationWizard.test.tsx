import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import {
  ConfigurationStepper,
  CampaignConfigurationStepSlot,
} from './CampaignConfigurationWizard'
import type { CampaignConfiguration } from './hooks'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () => null,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}))

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

const campaignId = '00000000-0000-4000-8000-000000000001'

function makeConfig(
  overrides: Partial<CampaignConfiguration> = {},
): CampaignConfiguration {
  return {
    campaign_id: campaignId,
    brand_workspace_id: '00000000-0000-4000-8000-000000000002',
    status: 'draft',
    editable: true,
    block_reason: null,
    current_step: 'targeting',
    completed_steps: ['content_type', 'pricing_model'],
    configuration_complete: false,
    configuration_version: 3,
    content_type: 'influencer_posts',
    pricing_model: 'fixed_per_video',
    operational_targeting: {
      countries: ['AR'],
      tiers: ['growing'],
      follower_min: null,
      follower_max: null,
      genders: [],
      age_min: null,
      age_max: null,
      interests: [],
      content_languages: [],
      source: 'brief_prefill',
      adjusted_from_brief: false,
    },
    bonus_config: {
      enabled: false,
      speed_bonus: { enabled: false, windows: [] },
      performance_bonus: { enabled: false, milestones: [] },
    },
    brief_summary: {
      confirmed_at: '2026-05-09T10:00:00Z',
      objective: 'brand_awareness',
      icp_description: null,
      icp_age_min: null,
      icp_age_max: null,
      icp_genders: [],
      icp_countries: [],
      icp_platforms: [],
      icp_interests: [],
      scoring_dimensions_count: 0,
      hard_filters_count: 0,
      disqualifiers_count: 0,
    },
    plan: {
      workspace_plan: 'paid',
      allows_campaign_board: true,
      allows_automatic_matching: true,
    },
    updated_at: '2026-05-09T10:00:00Z',
    ...overrides,
  }
}

describe('ConfigurationStepper', () => {
  it('marks completed, current and upcoming steps', () => {
    render(<ConfigurationStepper config={makeConfig()} />)

    expect(
      screen.getByText('Contenido').closest('[data-state]'),
    ).toHaveAttribute('data-state', 'completed')
    expect(screen.getByText('Pago').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'completed',
    )
    expect(
      screen.getByText('Targeting').closest('[data-state]'),
    ).toHaveAttribute('data-state', 'current')
    expect(screen.getByText('Bonos').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'upcoming',
    )
    expect(screen.getByText('Review').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'upcoming',
    )
  })

  it('is axe-clean', async () => {
    const { container } = render(<ConfigurationStepper config={makeConfig()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('CampaignConfigurationStepSlot', () => {
  it('renders targeting step with campaign configuration', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CampaignConfigurationStepSlot config={makeConfig()} step="targeting" />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Geografía' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Argentina' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
