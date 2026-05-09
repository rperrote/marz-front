import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BonusStep,
  normalizeBonusConfig,
  performanceBonusSectionError,
  speedBonusSectionError,
} from './BonusStep'
import { campaignConfigurationQueryKey } from './hooks'
import type { CampaignConfiguration } from './hooks'
import type { BonusConfigValues } from './schemas'

const campaignId = '00000000-0000-4000-8000-000000000001'
const speedWindowId = '00000000-0000-4000-8000-000000000101'
const milestoneId = '00000000-0000-4000-8000-000000000201'

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

function makeBonusConfig(
  overrides: Partial<CampaignConfiguration['bonus_config']> = {},
): CampaignConfiguration['bonus_config'] {
  return {
    enabled: true,
    speed_bonus: {
      enabled: true,
      windows: [
        {
          window_id: speedWindowId,
          window_hours: 24,
          bonus_pct: 25,
        },
      ],
    },
    performance_bonus: {
      enabled: true,
      milestones: [
        {
          milestone_id: milestoneId,
          views: 50000,
          window_hours: 168,
          bonus_pct: 15,
        },
      ],
    },
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
    current_step: 'bonus',
    completed_steps: ['content_type', 'pricing_model', 'targeting'],
    configuration_complete: false,
    configuration_version: 9,
    content_type: 'influencer_posts',
    pricing_model: 'per_views',
    operational_targeting: {
      countries: ['AR'],
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
    },
    bonus_config: makeBonusConfig(),
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
      <BonusStep campaignId={campaignId} config={config} />
    </QueryClientProvider>,
  )

  return { queryClient, invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('bonus config helpers', () => {
  it('returns the empty backend shape when global bonus is disabled', () => {
    expect(
      normalizeBonusConfig(
        makeBonusConfig({
          enabled: false,
        }),
      ),
    ).toEqual({
      enabled: false,
      speed_bonus: { enabled: false, windows: [] },
      performance_bonus: { enabled: false, milestones: [] },
    })
  })

  it('detects duplicate speed windows and increasing speed bonus percentages', () => {
    expect(
      speedBonusSectionError([
        { window_hours: 24, bonus_pct: 20 },
        { window_hours: 24, bonus_pct: 10 },
      ]),
    ).toContain('ventanas duplicadas')

    expect(
      speedBonusSectionError([
        { window_hours: 24, bonus_pct: 10 },
        { window_hours: 72, bonus_pct: 20 },
      ]),
    ).toContain('no puede crecer')
  })

  it('detects duplicate performance milestones', () => {
    expect(
      performanceBonusSectionError([
        { views: 10000, window_hours: 168, bonus_pct: 10 },
        { views: 10000, window_hours: 336, bonus_pct: 20 },
      ]),
    ).toContain('milestones duplicados')
  })
})

describe('BonusStep', () => {
  it('clears sections and sends the empty shape when global bonus is disabled', async () => {
    const user = userEvent.setup()
    const response = makeConfig({
      current_step: 'review',
      completed_steps: ['content_type', 'pricing_model', 'targeting', 'bonus'],
      configuration_version: 10,
      bonus_config: {
        enabled: false,
        speed_bonus: { enabled: false, windows: [] },
        performance_bonus: { enabled: false, milestones: [] },
      },
    })
    mockCustomFetch.mockResolvedValue({ data: response })
    const { queryClient } = renderStep()

    await user.click(
      screen.getByRole('switch', { name: 'Activar bonus de pago' }),
    )
    expect(
      screen.queryByRole('button', { name: /speed bonus/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        `/v1/campaigns/${campaignId}/configuration/bonus`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            bonus_config: {
              enabled: false,
              speed_bonus: { enabled: false, windows: [] },
              performance_bonus: { enabled: false, milestones: [] },
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
      params: { campaignId, step: 'review' },
    })
  })

  it('clears only the disabled section', async () => {
    const user = userEvent.setup()
    const response = makeConfig({
      current_step: 'review',
      configuration_version: 10,
      bonus_config: makeBonusConfig({
        performance_bonus: { enabled: false, milestones: [] },
      }),
    })
    mockCustomFetch.mockResolvedValue({ data: response })
    renderStep()

    await user.click(screen.getByRole('button', { name: /performance bonus/i }))
    expect(screen.queryByLabelText('Views milestone 1')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Horas ventana 1')).toHaveValue(24)

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalled()
    })
    const body = JSON.parse(
      (mockCustomFetch.mock.calls[0]?.[1] as { body: string }).body,
    ) as { bonus_config: BonusConfigValues }
    expect(body.bonus_config.speed_bonus.windows).toHaveLength(1)
    expect(body.bonus_config.performance_bonus).toEqual({
      enabled: false,
      milestones: [],
    })
  })

  it('adds rows, then submits speed windows with persisted ids', async () => {
    const user = userEvent.setup()
    const response = makeConfig({
      current_step: 'review',
      configuration_version: 10,
    })
    mockCustomFetch.mockResolvedValue({ data: response })
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Agregar ventana' }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalled()
    })
    const body = JSON.parse(
      (mockCustomFetch.mock.calls[0]?.[1] as { body: string }).body,
    ) as { bonus_config: BonusConfigValues }
    expect(body.bonus_config.speed_bonus.windows).toEqual([
      { window_id: speedWindowId, window_hours: 24, bonus_pct: 25 },
      { window_hours: 48, bonus_pct: 20 },
    ])
    expect(body.bonus_config.performance_bonus.milestones).toHaveLength(1)
    expect(
      body.bonus_config.performance_bonus.milestones[0]?.milestone_id,
    ).toBe(milestoneId)
  })

  it('removes speed and performance rows locally', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Agregar ventana' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar ventana 2' }))
    await user.click(screen.getByRole('button', { name: 'Agregar milestone' }))
    await user.click(
      screen.getByRole('button', { name: 'Eliminar milestone 2' }),
    )

    expect(screen.queryByLabelText('Horas ventana 2')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Views milestone 2')).not.toBeInTheDocument()
  })

  it('shows inline range errors and disables continue', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.clear(screen.getByLabelText('Horas ventana 1'))
    await user.type(screen.getByLabelText('Horas ventana 1'), '721')
    await user.tab()
    await user.clear(screen.getByLabelText('Porcentaje bonus 1'))
    await user.type(screen.getByLabelText('Porcentaje bonus 1'), '101')
    await user.tab()
    await user.clear(screen.getByLabelText('Views milestone 1'))
    await user.type(screen.getByLabelText('Views milestone 1'), '0')
    await user.tab()

    expect(
      await screen.findByText('La ventana debe ser entre 1 y 720 horas.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('El porcentaje debe ser entre 1 y 100.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Las views deben ser mayores a 0.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('navigates without saving when bonus is already completed and pristine', async () => {
    const user = userEvent.setup()
    renderStep(
      makeConfig({
        completed_steps: [
          'content_type',
          'pricing_model',
          'targeting',
          'bonus',
        ],
      }),
    )

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(mockCustomFetch).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'review' },
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

    await user.click(screen.getByRole('button', { name: 'Agregar ventana' }))
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
