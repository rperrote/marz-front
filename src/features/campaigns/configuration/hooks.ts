import { z } from 'zod'

import { queryOptions } from '@tanstack/react-query'

import {
  useGetCampaignConfiguration,
  useUpdateCampaignConfigurationContentType,
  useUpdateCampaignConfigurationPricingModel,
  useUpdateCampaignConfigurationTargeting,
  useUpdateCampaignConfigurationBonus,
  useActivateCampaignConfiguration,
  getCampaignConfiguration,
  getGetCampaignConfigurationQueryKey,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignConfigurationResponse,
  CampaignContentType,
  CampaignPricingModel,
  CampaignConfigurationStep,
  UpdateCampaignTargetingRequest,
  UpdateCampaignBonusRequest,
} from '#/shared/api/generated/model'
import type { BonusConfigValues, OperationalTargetingValues } from './schemas'

const CampaignConfigurationStepSchema = z.enum([
  'content_type',
  'pricing_model',
  'targeting',
  'bonus',
  'review',
])

// The parent route `/_brand/campaigns/$campaignId` declares a search schema
// with required `tab`/`section` (defaulted via zod). TanStack Router's typed
// Link/navigate APIs surface those as required even on child routes that
// don't read them. Re-export the defaults so call sites keep one source of
// truth instead of repeating the literals.
export const campaignDetailSearchDefaults = {
  tab: 'overview' as const,
  section: 'matches' as const,
}

export const CAMPAIGN_CONFIGURATION_STEPS =
  CampaignConfigurationStepSchema.options

export type {
  CampaignContentType,
  CampaignPricingModel,
  CampaignConfigurationStep,
}
export type CampaignConfiguration = CampaignConfigurationResponse

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

interface UpdateCampaignBonusParams {
  campaignId: string
  bonus_config: BonusConfigValues
  configuration_version: number
}

interface ActivateCampaignConfigurationParams {
  campaignId: string
  configuration_version: number
}

export function isCampaignConfigurationStep(
  value: string,
): value is CampaignConfigurationStep {
  return CampaignConfigurationStepSchema.safeParse(value).success
}

export function campaignConfigurationQueryKey(campaignId: string) {
  return getGetCampaignConfigurationQueryKey(campaignId)
}

async function fetchCampaignConfiguration(
  campaignId: string,
  signal?: AbortSignal,
): Promise<CampaignConfiguration> {
  const response = await getCampaignConfiguration(campaignId, { signal })
  if (response.status !== 200) {
    throw new Error(`Unexpected status ${response.status}`)
  }
  return response.data
}

export function campaignConfigurationQueryOptions(campaignId: string) {
  return queryOptions({
    queryKey: campaignConfigurationQueryKey(campaignId),
    queryFn: ({ signal }) => fetchCampaignConfiguration(campaignId, signal),
  })
}

export function useCampaignConfigurationQuery(campaignId: string) {
  return useGetCampaignConfiguration(campaignId, {
    query: {
      select: (response): CampaignConfiguration => {
        if (response.status !== 200) {
          throw new Error(`Unexpected status ${response.status}`)
        }
        return response.data
      },
    },
  })
}

// Adapta una mutation Orval `{campaignId, data}` a la firma plana legacy
// del front (params planos + response plano CampaignConfiguration).
function adaptMutation<TParams, TData>(
  mutation: {
    mutateAsync: (vars: {
      campaignId: string
      data: TData
    }) => Promise<{ status: number; data: unknown }>
    isPending: boolean
    reset: () => void
  },
  buildData: (params: TParams) => { campaignId: string; data: TData },
) {
  const mutateAsync = async (
    params: TParams,
  ): Promise<CampaignConfiguration> => {
    const { campaignId, data } = buildData(params)
    const response = await mutation.mutateAsync({ campaignId, data })
    if (response.status !== 200) {
      throw new Error(`Unexpected status ${response.status}`)
    }
    return response.data as CampaignConfiguration
  }
  const mutate = (
    params: TParams,
    options?: {
      onSuccess?: (data: CampaignConfiguration) => void
      onError?: (error: Error) => void
    },
  ) => {
    mutateAsync(params)
      .then((data) => options?.onSuccess?.(data))
      .catch((err: Error) => options?.onError?.(err))
  }
  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    reset: mutation.reset,
  }
}

export function useUpdateContentTypeMutation() {
  return adaptMutation<
    UpdateContentTypeParams,
    { content_type: CampaignContentType; configuration_version: number }
  >(
    useUpdateCampaignConfigurationContentType(),
    ({ campaignId, content_type, configuration_version }) => ({
      campaignId,
      data: { content_type, configuration_version },
    }),
  )
}

export function useUpdatePricingModelMutation() {
  return adaptMutation<
    UpdatePricingModelParams,
    { pricing_model: CampaignPricingModel; configuration_version: number }
  >(
    useUpdateCampaignConfigurationPricingModel(),
    ({ campaignId, pricing_model, configuration_version }) => ({
      campaignId,
      data: { pricing_model, configuration_version },
    }),
  )
}

export function useUpdateCampaignTargetingMutation() {
  return adaptMutation<
    UpdateCampaignTargetingParams,
    UpdateCampaignTargetingRequest
  >(
    useUpdateCampaignConfigurationTargeting(),
    ({ campaignId, operational_targeting, configuration_version }) => ({
      campaignId,
      data: { operational_targeting, configuration_version },
    }),
  )
}

export function useUpdateCampaignBonusMutation() {
  return adaptMutation<UpdateCampaignBonusParams, UpdateCampaignBonusRequest>(
    useUpdateCampaignConfigurationBonus(),
    ({ campaignId, bonus_config, configuration_version }) => ({
      campaignId,
      data: { bonus_config, configuration_version },
    }),
  )
}

export function useActivateCampaignConfigurationMutation() {
  const mutation = useActivateCampaignConfiguration()
  const mutateAsync = async ({
    campaignId,
    configuration_version,
  }: ActivateCampaignConfigurationParams): Promise<void> => {
    await mutation.mutateAsync({
      campaignId,
      data: { configuration_version },
    })
  }
  const mutate = (
    params: ActivateCampaignConfigurationParams,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => {
    mutateAsync(params)
      .then(() => options?.onSuccess?.())
      .catch((err: Error) => options?.onError?.(err))
  }
  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    reset: mutation.reset,
  }
}
