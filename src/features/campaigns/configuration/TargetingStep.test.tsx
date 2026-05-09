import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TargetingStep, buildOperationalTargetingPatch } from './TargetingStep'
import { campaignConfigurationQueryKey } from './hooks'
import type { CampaignConfiguration } from './hooks'
import type { OperationalTargetingValues } from './schemas'

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

function makeTargeting(
  overrides: Partial<OperationalTargetingValues> = {},
): OperationalTargetingValues {
  return {
    countries: ['AR', 'MX'],
    tiers: ['emergent'],
    follower_min: 10000,
    follower_max: 500000,
    genders: ['female'],
    age_min: 18,
    age_max: 35,
    interests: ['fitness'],
    content_languages: ['es'],
    source: 'brief_prefill',
    adjusted_from_brief: false,
    ...overrides,
  }
}

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
    configuration_version: 9,
    content_type: 'influencer_posts',
    pricing_model: 'per_views',
    operational_targeting: makeTargeting(),
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
      <TargetingStep campaignId={campaignId} config={config} />
    </QueryClientProvider>,
  )

  return { queryClient, invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildOperationalTargetingPatch', () => {
  it('returns only changed targeting fields', () => {
    const initial = makeTargeting()
    const current = makeTargeting({
      tiers: ['emergent', 'consolidated'],
      follower_min: 20000,
      adjusted_from_brief: true,
    })

    expect(buildOperationalTargetingPatch(initial, current)).toEqual({
      tiers: ['emergent', 'consolidated'],
      follower_min: 20000,
    })
  })
})

describe('TargetingStep', () => {
  it('mounts with targeting prefill from the configuration', () => {
    renderStep()

    expect(screen.getByRole('button', { name: 'Argentina' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Emergente' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Seguidores mínimos')).toHaveValue(10000)
  })

  it('shows inline range errors and disables continue', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.clear(screen.getByLabelText('Seguidores máximos'))
    await user.type(screen.getByLabelText('Seguidores máximos'), '5000')
    await user.tab()

    expect(
      await screen.findByText(
        'El máximo de seguidores debe ser mayor o igual al mínimo.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('shows inline country code errors', async () => {
    const user = userEvent.setup()
    renderStep(
      makeConfig({
        operational_targeting: makeTargeting({ countries: [] }),
      }),
    )

    await user.type(screen.getByLabelText('Países'), 'XX{Enter}')

    expect(
      await screen.findByText(
        'Ingresá un código de país ISO-3166 alpha-2 válido.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('patches only dirty targeting fields with the current configuration version', async () => {
    const user = userEvent.setup()
    const response = makeConfig({
      current_step: 'bonus',
      completed_steps: ['content_type', 'pricing_model', 'targeting'],
      configuration_version: 10,
      operational_targeting: makeTargeting({
        tiers: ['emergent', 'consolidated'],
        follower_min: 20000,
        adjusted_from_brief: true,
        source: 'manual',
      }),
    })
    mockCustomFetch.mockResolvedValue({ data: response })
    const { queryClient } = renderStep()

    await user.click(screen.getByRole('button', { name: 'Consolidado' }))
    await user.clear(screen.getByLabelText('Seguidores mínimos'))
    await user.type(screen.getByLabelText('Seguidores mínimos'), '20000')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        `/v1/campaigns/${campaignId}/configuration/targeting`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            operational_targeting: {
              tiers: ['emergent', 'consolidated'],
              follower_min: 20000,
            },
            configuration_version: 9,
          }),
        },
      )
    })
    expect(
      queryClient.getQueryData(campaignConfigurationQueryKey(campaignId)),
    ).toEqual(response)
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'bonus' },
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

    await user.click(screen.getByRole('button', { name: 'Consolidado' }))
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
