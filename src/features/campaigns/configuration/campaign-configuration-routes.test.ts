import { describe, expect, it, vi } from 'vitest'
import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { ApiError } from '#/shared/api/mutator'
import { campaignDetailSearchDefaults } from './hooks'
import type { CampaignConfiguration } from './hooks'

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
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
    current_step: 'pricing_model',
    completed_steps: ['content_type'],
    configuration_complete: false,
    configuration_version: 2,
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

function makeQueryClient(result: Promise<CampaignConfiguration>) {
  return {
    ensureQueryData: vi.fn(() => result),
  } as unknown as QueryClient
}

describe('campaign configuration routes', () => {
  it('validateSearch accepts absent from and known sources', async () => {
    const { validateConfigurationSearch } =
      await import('#/routes/_brand/campaigns.$campaignId.configuration')

    expect(validateConfigurationSearch({})).toEqual({})
    expect(validateConfigurationSearch({ from: 'brief-builder' })).toEqual({
      from: 'brief-builder',
    })
    expect(() =>
      validateConfigurationSearch({ from: 'creator-board' }),
    ).toThrow()
  })

  it('lets an admin continue when backend returns editable configuration', async () => {
    const { loadCampaignConfigurationRoute } =
      await import('#/routes/_brand/campaigns.$campaignId.configuration')
    const config = makeConfig()

    await expect(
      loadCampaignConfigurationRoute({
        campaignId,
        pathname: `/campaigns/${campaignId}/configuration/pricing_model`,
        queryClient: makeQueryClient(Promise.resolve(config)),
      }),
    ).resolves.toEqual(config)
  })

  it('redirects /configuration to the current backend step', async () => {
    const { loadCampaignConfigurationRoute } =
      await import('#/routes/_brand/campaigns.$campaignId.configuration')

    await expect(
      loadCampaignConfigurationRoute({
        campaignId,
        pathname: `/campaigns/${campaignId}/configuration`,
        queryClient: makeQueryClient(Promise.resolve(makeConfig())),
      }),
    ).rejects.toEqual(
      redirect({
        to: '/campaigns/$campaignId/configuration/$step',
        params: { campaignId, step: 'pricing_model' },
        search: campaignDetailSearchDefaults,
      }),
    )
  })

  it('redirects brief_not_confirmed to the campaign brief', async () => {
    const { loadCampaignConfigurationRoute } =
      await import('#/routes/_brand/campaigns.$campaignId.configuration')

    await expect(
      loadCampaignConfigurationRoute({
        campaignId,
        pathname: `/campaigns/${campaignId}/configuration/content_type`,
        queryClient: makeQueryClient(
          Promise.resolve(makeConfig({ block_reason: 'brief_not_confirmed' })),
        ),
      }),
    ).rejects.toEqual(
      redirect({
        to: '/campaigns/$campaignId/brief',
        params: { campaignId },
        search: campaignDetailSearchDefaults,
      }),
    )
  })

  it.each(['already_active', 'not_draft'] as const)(
    'redirects %s to the campaign detail',
    async (blockReason) => {
      const { loadCampaignConfigurationRoute } =
        await import('#/routes/_brand/campaigns.$campaignId.configuration')

      await expect(
        loadCampaignConfigurationRoute({
          campaignId,
          pathname: `/campaigns/${campaignId}/configuration/content_type`,
          queryClient: makeQueryClient(
            Promise.resolve(makeConfig({ block_reason: blockReason })),
          ),
        }),
      ).rejects.toEqual(
        redirect({
          to: '/campaigns/$campaignId',
          params: { campaignId },
          search: campaignDetailSearchDefaults,
        }),
      )
    },
  )

  it('redirects forbidden_role API errors to campaigns', async () => {
    const [{ loadCampaignConfigurationRoute }, { toast }] = await Promise.all([
      import('#/routes/_brand/campaigns.$campaignId.configuration'),
      import('sonner'),
    ])

    await expect(
      loadCampaignConfigurationRoute({
        campaignId,
        pathname: `/campaigns/${campaignId}/configuration/content_type`,
        queryClient: makeQueryClient(
          Promise.reject(new ApiError(403, 'forbidden_role', 'Forbidden')),
        ),
      }),
    ).rejects.toEqual(redirect({ to: '/campaigns' }))
    expect(toast.error).toHaveBeenCalledWith(
      'No tenés permisos para configurar esta campaña.',
    )
  })

  it('redirects invalid step params to the current backend step', async () => {
    const { loadCampaignConfigurationStepRoute } =
      await import('#/routes/_brand/campaigns.$campaignId.configuration.$step')

    await expect(
      loadCampaignConfigurationStepRoute({
        campaignId,
        step: 'unknown',
        queryClient: makeQueryClient(Promise.resolve(makeConfig())),
      }),
    ).rejects.toEqual(
      redirect({
        to: '/campaigns/$campaignId/configuration/$step',
        params: { campaignId, step: 'pricing_model' },
        search: campaignDetailSearchDefaults,
      }),
    )
  })
})
