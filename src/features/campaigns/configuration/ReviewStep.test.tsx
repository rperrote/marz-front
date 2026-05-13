import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewStep, getActivationErrorAction } from './ReviewStep'
import type { CampaignConfiguration } from './hooks'

const campaignId = '00000000-0000-4000-8000-000000000001'

const {
  mockCustomFetch,
  mockNavigate,
  mockToastSuccess,
  mockToastError,
  TestApiError,
} = vi.hoisted(() => {
  class HoistedApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
      public details?: { field_errors?: Record<string, string[]> },
      public body?: unknown,
    ) {
      super(message)
    }
  }

  return {
    mockCustomFetch: vi.fn(),
    mockNavigate: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    TestApiError: HoistedApiError,
  }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('#/shared/api/mutator', () => ({
  ApiError: TestApiError,
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
  default: (...args: unknown[]) => mockCustomFetch(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
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

function makeConfig(
  overrides: Partial<CampaignConfiguration> = {},
): CampaignConfiguration {
  return {
    campaign_id: campaignId,
    brand_workspace_id: '00000000-0000-4000-8000-000000000002',
    status: 'draft',
    editable: true,
    block_reason: null,
    current_step: 'review',
    completed_steps: [
      'content_type',
      'pricing_model',
      'targeting',
      'bonus',
      'review',
    ],
    configuration_complete: true,
    configuration_version: 11,
    content_type: 'influencer_posts',
    pricing_model: 'per_views',
    operational_targeting: {
      countries: ['AR', 'MX', 'BR'],
      tiers: ['emergent', 'growing'],
      follower_min: 10000,
      follower_max: 500000,
      genders: [],
      age_min: 18,
      age_max: 35,
      interests: ['fitness', 'wellness'],
      content_languages: ['es', 'pt'],
      source: 'brief_prefill',
      adjusted_from_brief: false,
    },
    bonus_config: {
      enabled: true,
      speed_bonus: {
        enabled: true,
        windows: [
          {
            window_id: '00000000-0000-4000-8000-000000000101',
            window_hours: 24,
            bonus: { type: 'percentage', percentage: 25 },
          },
        ],
      },
      performance_bonus: {
        enabled: true,
        milestones: [
          {
            milestone_id: '00000000-0000-4000-8000-000000000201',
            views: 10000,
            window_hours: 72,
            bonus: { type: 'fixed', amount: '50.00', currency: 'USD' },
          },
        ],
      },
    },
    brief_summary: {
      confirmed_at: '2026-05-09T10:00:00Z',
      objective: 'brand_awareness',
      icp_description: 'Creators fitness/wellness',
      icp_age_min: 18,
      icp_age_max: 35,
      icp_genders: [],
      icp_countries: ['AR', 'MX', 'BR'],
      icp_platforms: ['instagram', 'tiktok'],
      icp_interests: ['fitness'],
      scoring_dimensions_count: 3,
      hard_filters_count: 2,
      disqualifiers_count: 1,
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

function renderStep(config = makeConfig()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <ReviewStep campaignId={campaignId} config={config} />
    </QueryClientProvider>,
  )

  return { invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(
    '11111111-1111-4111-8111-111111111111',
  )
})

describe('getActivationErrorAction', () => {
  it('maps version conflicts to latest reload', () => {
    expect(
      getActivationErrorAction(
        new TestApiError(
          409,
          'configuration_version_conflict',
          'Version conflict',
        ),
      ),
    ).toEqual({ type: 'reload_latest' })
  })

  it('maps incomplete configuration to the current step from the API body', () => {
    expect(
      getActivationErrorAction(
        new TestApiError(
          409,
          'configuration_incomplete',
          'Incomplete',
          undefined,
          { current_step: 'targeting' },
        ),
      ),
    ).toEqual({ type: 'redirect_to_step', step: 'targeting' })
  })

  it('falls back to content type when incomplete response has no valid step', () => {
    expect(
      getActivationErrorAction(
        new TestApiError(409, 'configuration_incomplete', 'Incomplete'),
      ),
    ).toEqual({ type: 'redirect_to_step', step: 'content_type' })
  })
})

describe('ReviewStep', () => {
  it('renders the review blocks and brief summary with configuration data', () => {
    renderStep()

    expect(
      screen.getByRole('heading', { name: 'Tipo de contenido' }),
    ).toBeVisible()
    expect(screen.getByText('Influencer Posts')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeVisible()
    expect(screen.getByText('Precio por views')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Targeting' })).toBeVisible()
    expect(screen.getByText('3 seleccionados')).toBeVisible()
    expect(screen.getByText('Emergente · En crecimiento')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Bonus' })).toBeVisible()
    expect(screen.getByText('≤ 24 hs · +25%')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Brief' })).toBeVisible()
    expect(
      screen.getByText(
        'Brand Awareness — 3 dimensiones de scoring · 2 hard filters · 1 descalificadores',
      ),
    ).toBeVisible()
  })

  it('navigates edit actions to the matching wizard step and opens the brief', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]!)
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'content_type' },
      search: { tab: 'overview', section: 'matches' },
    })

    await user.click(screen.getByRole('button', { name: 'Ver brief' }))
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/brief',
      params: { campaignId },
      search: { tab: 'overview', section: 'matches' },
    })
  })

  it('posts activation with idempotency key and configuration version', async () => {
    const user = userEvent.setup()
    mockCustomFetch.mockResolvedValue({ data: {}, status: 200 })
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Activar campaña' }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        `/v1/campaigns/${campaignId}/configuration/activate`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ configuration_version: 11 }),
        }),
      )
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Campaña activada.')
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId',
      params: { campaignId },
      search: { tab: 'overview', section: 'matches' },
    })
  })

  it('shows conflict banner and reloads configuration on version conflict', async () => {
    const user = userEvent.setup()
    mockCustomFetch.mockRejectedValue(
      new TestApiError(
        409,
        'configuration_version_conflict',
        'Version conflict',
      ),
    )
    const { invalidateSpy } = renderStep()

    await user.click(screen.getByRole('button', { name: 'Activar campaña' }))

    expect(
      await screen.findByText(
        'La configuración cambió, revisá los datos actualizados.',
      ),
    ).toBeVisible()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [`/v1/campaigns/${campaignId}/configuration`],
    })
  })

  it('redirects to the pending step on incomplete configuration', async () => {
    const user = userEvent.setup()
    mockCustomFetch.mockRejectedValue(
      new TestApiError(
        409,
        'configuration_incomplete',
        'Incomplete',
        undefined,
        { current_step: 'pricing_model' },
      ),
    )
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Activar campaña' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/campaigns/$campaignId/configuration/$step',
        params: { campaignId, step: 'pricing_model' },
        search: { tab: 'overview', section: 'matches' },
      })
    })
  })

  it('disables activation when configuration is incomplete', () => {
    renderStep(makeConfig({ configuration_complete: false }))

    expect(
      screen.getByRole('button', { name: 'Activar campaña' }),
    ).toBeDisabled()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <ReviewStep campaignId={campaignId} config={makeConfig()} />
      </QueryClientProvider>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
