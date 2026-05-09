import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import customFetch, { ApiError } from '#/shared/api/mutator'
import type { OperationalTargetingValues } from './schemas'

const CampaignConfigurationStepSchema = z.enum([
  'content_type',
  'pricing_model',
  'targeting',
  'bonus',
  'review',
])

const CampaignConfigurationBlockReasonSchema = z.enum([
  'brief_not_confirmed',
  'already_active',
  'not_draft',
  'forbidden_role',
])

const CampaignContentTypeSchema = z.enum(['influencer_posts', 'ugc_videos'])
const CampaignPricingModelSchema = z.enum(['fixed_per_video', 'per_views'])

const CampaignConfigurationResponseSchema = z.object({
  campaign_id: z.string().uuid(),
  brand_workspace_id: z.string().uuid(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  editable: z.boolean(),
  block_reason: CampaignConfigurationBlockReasonSchema.nullable(),
  current_step: CampaignConfigurationStepSchema,
  completed_steps: z.array(CampaignConfigurationStepSchema),
  configuration_complete: z.boolean(),
  configuration_version: z.number().int().positive(),
  content_type: CampaignContentTypeSchema.nullable(),
  pricing_model: CampaignPricingModelSchema.nullable(),
  operational_targeting: z.object({
    countries: z.array(z.string()),
    tiers: z.array(
      z.enum([
        'emergent',
        'growing',
        'consolidated',
        'reference',
        'massive',
        'celebrity',
      ]),
    ),
    follower_min: z.number().int().min(0).nullable(),
    follower_max: z.number().int().min(0).nullable(),
    genders: z.array(z.string()),
    age_min: z.number().int().min(18).max(120).nullable(),
    age_max: z.number().int().min(18).max(120).nullable(),
    interests: z.array(z.string()),
    content_languages: z.array(z.string()),
    source: z.enum(['brief_prefill', 'manual']),
    adjusted_from_brief: z.boolean(),
  }),
  bonus_config: z.object({
    enabled: z.boolean(),
    speed_bonus: z.object({
      enabled: z.boolean(),
      windows: z.array(
        z.object({
          window_id: z.string().uuid(),
          window_hours: z.number().int().positive(),
          bonus_pct: z.number().int().min(1).max(100),
        }),
      ),
    }),
    performance_bonus: z.object({
      enabled: z.boolean(),
      milestones: z.array(
        z.object({
          milestone_id: z.string().uuid(),
          views: z.number().int().positive(),
          window_hours: z.number().int().positive(),
          bonus_pct: z.number().int().min(1).max(100),
        }),
      ),
    }),
  }),
  brief_summary: z.object({
    confirmed_at: z.string(),
    objective: z.enum(['brand_awareness', 'conversion', 'engagement', 'reach']),
    icp_description: z.string().nullable(),
    icp_age_min: z.number().int().nullable(),
    icp_age_max: z.number().int().nullable(),
    icp_genders: z.array(z.string()),
    icp_countries: z.array(z.string()),
    icp_platforms: z.array(z.string()),
    icp_interests: z.array(z.string()),
    scoring_dimensions_count: z.number().int().min(0),
    hard_filters_count: z.number().int().min(0),
    disqualifiers_count: z.number().int().min(0),
  }),
  plan: z.object({
    workspace_plan: z.enum(['free', 'paid']),
    allows_campaign_board: z.boolean(),
    allows_automatic_matching: z.boolean(),
  }),
  updated_at: z.string(),
})

type ApiResponse<T> = {
  data: T
}

export const CAMPAIGN_CONFIGURATION_STEPS =
  CampaignConfigurationStepSchema.options

export type CampaignConfigurationStep =
  (typeof CAMPAIGN_CONFIGURATION_STEPS)[number]

export type CampaignConfiguration = z.infer<
  typeof CampaignConfigurationResponseSchema
>
export type CampaignContentType = z.infer<typeof CampaignContentTypeSchema>
export type CampaignPricingModel = z.infer<typeof CampaignPricingModelSchema>

interface UpdateContentTypeParams {
  campaignId: string
  content_type: CampaignContentType
  configuration_version: number
}

interface UpdatePricingModelParams {
  campaignId: string
  pricing_model: CampaignPricingModel
  configuration_version: number
}

interface UpdateCampaignTargetingParams {
  campaignId: string
  operational_targeting: Partial<OperationalTargetingValues>
  configuration_version: number
}

export function isCampaignConfigurationStep(
  value: string,
): value is CampaignConfigurationStep {
  return CampaignConfigurationStepSchema.safeParse(value).success
}

export function campaignConfigurationQueryKey(campaignId: string) {
  return ['campaign-configuration', campaignId] as const
}

export function campaignConfigurationQueryOptions(campaignId: string) {
  return queryOptions({
    queryKey: campaignConfigurationQueryKey(campaignId),
    queryFn: async ({ signal }): Promise<CampaignConfiguration> => {
      const response = await customFetch<ApiResponse<unknown>>(
        `/v1/campaigns/${campaignId}/configuration`,
        { signal },
      )
      return CampaignConfigurationResponseSchema.parse(response.data)
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status < 500) return false
      return failureCount < 2
    },
  })
}

export function useCampaignConfigurationQuery(campaignId: string) {
  return useQuery(campaignConfigurationQueryOptions(campaignId))
}

export function useUpdateContentTypeMutation() {
  return useMutation({
    mutationFn: async ({
      campaignId,
      content_type,
      configuration_version,
    }: UpdateContentTypeParams): Promise<CampaignConfiguration> => {
      const response = await customFetch<ApiResponse<unknown>>(
        `/v1/campaigns/${campaignId}/configuration/content_type`,
        {
          method: 'PATCH',
          body: JSON.stringify({ content_type, configuration_version }),
        },
      )
      return CampaignConfigurationResponseSchema.parse(response.data)
    },
    retry: false,
  })
}

export function useUpdatePricingModelMutation() {
  return useMutation({
    mutationFn: async ({
      campaignId,
      pricing_model,
      configuration_version,
    }: UpdatePricingModelParams): Promise<CampaignConfiguration> => {
      const response = await customFetch<ApiResponse<unknown>>(
        `/v1/campaigns/${campaignId}/configuration/pricing_model`,
        {
          method: 'PATCH',
          body: JSON.stringify({ pricing_model, configuration_version }),
        },
      )
      return CampaignConfigurationResponseSchema.parse(response.data)
    },
    retry: false,
  })
}

export function useUpdateCampaignTargetingMutation() {
  return useMutation({
    mutationFn: async ({
      campaignId,
      operational_targeting,
      configuration_version,
    }: UpdateCampaignTargetingParams): Promise<CampaignConfiguration> => {
      const response = await customFetch<ApiResponse<unknown>>(
        `/v1/campaigns/${campaignId}/configuration/targeting`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            operational_targeting,
            configuration_version,
          }),
        },
      )
      return CampaignConfigurationResponseSchema.parse(response.data)
    },
    retry: false,
  })
}
