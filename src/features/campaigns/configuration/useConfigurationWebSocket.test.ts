import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import type {
  CampaignConfigurationActivatedPayload,
  CampaignConfigurationUpdatedPayload,
  DomainEventEnvelope,
} from '#/shared/ws/events'
import { createCampaignConfigurationWsHandlers } from './useConfigurationWebSocket'
import { campaignConfigurationQueryKey } from './hooks'
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
    info: vi.fn(),
  },
}))

const campaignId = '00000000-0000-4000-8000-000000000001'

function makeEnvelope<TPayload>(
  eventType: string,
  payload: TPayload,
): DomainEventEnvelope<TPayload> {
  return {
    event_id: `evt-${eventType}`,
    event_type: eventType,
    schema_version: '1',
    aggregate_id: campaignId,
    aggregate_type: 'campaign',
    occurred_at: '2026-05-09T10:00:00Z',
    payload,
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
    current_step: 'content_type',
    completed_steps: [],
    configuration_complete: false,
    configuration_version: 1,
    content_type: null,
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

function makeUpdatedPayload(
  overrides: Partial<CampaignConfigurationUpdatedPayload> = {},
): CampaignConfigurationUpdatedPayload {
  return {
    event: 'campaign.configuration.updated',
    campaign_id: campaignId,
    brand_workspace_id: '00000000-0000-4000-8000-000000000002',
    changed_step: 'content_type',
    current_step: 'pricing_model',
    completed_steps: ['content_type'],
    configuration_version: 2,
    updated_at: '2026-05-09T10:05:00Z',
    ...overrides,
  }
}

describe('createCampaignConfigurationWsHandlers', () => {
  let queryClient: QueryClient
  let navigateToCampaign: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    navigateToCampaign = vi.fn()
    vi.clearAllMocks()
  })

  it('reconciles cache and invalidates when updated version is newer', async () => {
    const queryKey = campaignConfigurationQueryKey(campaignId)
    queryClient.setQueryData(queryKey, makeConfig())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const handlers = createCampaignConfigurationWsHandlers({
      campaignId,
      queryClient,
      navigateToCampaign,
    })

    handlers['campaigns.configuration.updated']!(
      makeEnvelope('campaigns.configuration.updated', makeUpdatedPayload()),
    )

    const nextConfig = queryClient.getQueryData<CampaignConfiguration>(queryKey)
    expect(nextConfig?.configuration_version).toBe(2)
    expect(nextConfig?.current_step).toBe('pricing_model')
    expect(nextConfig?.completed_steps).toEqual(['content_type'])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey })
    const { toast } = await import('sonner')
    expect(toast.info).toHaveBeenCalledWith(
      'La configuración cambió en otra sesión. Recargando.',
    )
  })

  it('does nothing when updated version is equal or older', async () => {
    const queryKey = campaignConfigurationQueryKey(campaignId)
    queryClient.setQueryData(
      queryKey,
      makeConfig({ current_step: 'targeting', configuration_version: 3 }),
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const handlers = createCampaignConfigurationWsHandlers({
      campaignId,
      queryClient,
      navigateToCampaign,
    })

    handlers['campaigns.configuration.updated']!(
      makeEnvelope(
        'campaigns.configuration.updated',
        makeUpdatedPayload({ configuration_version: 3 }),
      ),
    )

    const nextConfig = queryClient.getQueryData<CampaignConfiguration>(queryKey)
    expect(nextConfig?.current_step).toBe('targeting')
    expect(invalidateSpy).not.toHaveBeenCalled()
    const { toast } = await import('sonner')
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('invalidates campaign lists and redirects when configuration is activated', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const handlers = createCampaignConfigurationWsHandlers({
      campaignId,
      queryClient,
      navigateToCampaign,
    })
    const payload: CampaignConfigurationActivatedPayload = {
      event: 'campaign.configuration.activated',
      campaign_id: campaignId,
      brand_workspace_id: '00000000-0000-4000-8000-000000000002',
      status: 'active',
      configuration_version: 5,
      activated_at: '2026-05-09T10:10:00Z',
      plan_allows_campaign_board: true,
      plan_allows_automatic_matching: true,
    }

    handlers['campaigns.configuration.activated']!(
      makeEnvelope('campaigns.configuration.activated', payload),
    )

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/v1/campaigns'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/v1/campaigns', { status: 'active' }],
    })
    expect(navigateToCampaign).toHaveBeenCalledOnce()
  })
})
