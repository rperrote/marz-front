import { useQuery } from '@tanstack/react-query'
import { customFetch, ApiError } from '#/shared/api/mutator'
import type { BriefDraft } from '../brief-builder/store'

export interface CampaignBriefResponse {
  campaign_id: string
  campaign_name: string
  draft: BriefDraft
}

export function campaignBriefQueryKey(campaignId: string) {
  return ['/v1/campaigns', campaignId, 'brief'] as const
}

// RAFITA:BLOCKER: B.9 (GET /api/v1/campaigns/{id}/brief) y B.10 (Orval regen) pendientes.
// Cuando estén listos, reemplazar este hook manual por el generado por Orval.
export function useCampaignBrief(campaignId: string) {
  return useQuery({
    queryKey: campaignBriefQueryKey(campaignId),
    queryFn: async () => {
      const response = await customFetch<{ data: CampaignBriefResponse }>(
        `/api/v1/campaigns/${campaignId}/brief`,
      )
      return response.data
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  })
}
