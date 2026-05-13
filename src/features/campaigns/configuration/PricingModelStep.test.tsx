import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PricingModelStep } from './PricingModelStep'
import { campaignConfigurationQueryKey } from './hooks'
import type { CampaignConfiguration } from './hooks'

const campaignId = '00000000-0000-4000-8000-000000000001'

const { mockCustomFetch, mockNavigate, mockToastError, TestApiError } =
  vi.hoisted(() => {
    class HoistedApiError extends Error {
      constructor(
        public status: number,
        public code: string,
        message: string,
      ) {
        super(message)
      }
    }

    return {
      mockCustomFetch: vi.fn(),
      mockNavigate: vi.fn(),
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
    current_step: 'pricing_model',
    completed_steps: ['content_type'],
    configuration_complete: false,
    configuration_version: 7,
    content_type: 'influencer_posts',
    pricing_model: null,
    operational_targeting: {
      countries: [],
      tiers: [],
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

function renderStep(config = makeConfig()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <PricingModelStep campaignId={campaignId} config={config} />
    </QueryClientProvider>,
  )

  return { queryClient, invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PricingModelStep', () => {
  it('disables continue until a card is selected', async () => {
    const user = userEvent.setup()
    renderStep()

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /per views/i }))

    expect(continueButton).toBeEnabled()
  })

  it('patches selected pricing model with the current configuration version', async () => {
    const user = userEvent.setup()
    const response = makeConfig({
      current_step: 'targeting',
      completed_steps: ['content_type', 'pricing_model'],
      pricing_model: 'per_views',
      configuration_version: 8,
    })
    mockCustomFetch.mockResolvedValue({ data: response, status: 200 })
    const { queryClient } = renderStep()

    await user.click(screen.getByRole('button', { name: /per views/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        `/v1/campaigns/${campaignId}/configuration/pricing_model`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            pricing_model: 'per_views',
            configuration_version: 7,
          }),
        }),
      )
    })
    expect(
      queryClient.getQueryData(campaignConfigurationQueryKey(campaignId)),
    ).toEqual(response)
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'targeting' },
      search: { tab: 'overview', section: 'matches' },
    })
  })

  it('starts with the persisted selection when the step reloads', () => {
    renderStep(makeConfig({ pricing_model: 'fixed_per_video' }))

    expect(
      screen.getByRole('button', { name: /fixed per video/i }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled()
  })

  it('navigates back to content type', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('button', { name: /atrás/i }))

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'content_type' },
      search: { tab: 'overview', section: 'matches' },
    })
  })

  it('invalidates configuration query and shows a toast on version conflict', async () => {
    const user = userEvent.setup()
    mockCustomFetch.mockRejectedValue(
      new TestApiError(
        409,
        'configuration_version_conflict',
        'Configuration version conflict',
      ),
    )
    const { invalidateSpy } = renderStep()

    await user.click(screen.getByRole('button', { name: /fixed per video/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: campaignConfigurationQueryKey(campaignId),
      })
    })
    expect(mockToastError).toHaveBeenCalledWith(
      'La configuración fue modificada en otra sesión, recargando.',
    )
  })
})
