import { useMutation } from '@tanstack/react-query'
import { customFetch, ApiError } from '#/shared/api/mutator'
import type { BriefDraft } from '../store'

interface CreateCampaignParams {
  brandWorkspaceId: string
  idempotencyKey: string
  draft: BriefDraft
}

interface CreateCampaignResponse {
  data: { campaign_id: string }
  status: number
  headers: Headers
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (params: CreateCampaignParams) => {
      const { draft, brandWorkspaceId, idempotencyKey } = params

      const result = await customFetch<CreateCampaignResponse>(
        '/api/v1/campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            brand_workspace_id: brandWorkspaceId,
            name: draft.campaign.name,
            objective: draft.campaign.objective,
            budget_amount: draft.campaign.budget_amount,
            budget_currency: draft.campaign.budget_currency,
            deadline: draft.campaign.deadline || undefined,
            brief: {
              icp_description: draft.brief.icp_description,
              icp_age_min: draft.brief.icp_age_min,
              icp_age_max: draft.brief.icp_age_max,
              icp_genders: draft.brief.icp_genders,
              icp_countries: draft.brief.icp_countries,
              icp_platforms: draft.brief.icp_platforms,
              icp_interests: draft.brief.icp_interests,
              scoring_dimensions: draft.brief.scoring_dimensions,
              hard_filters: draft.brief.hard_filters.map(
                ({ id: _, ...rest }) => rest,
              ),
              disqualifiers: draft.brief.disqualifiers,
            },
          }),
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      )

      return result.data
    },
  })
}

export function getCreateCampaignFieldErrors(
  error: unknown,
): Record<string, string[]> | null {
  if (!(error instanceof ApiError)) return null
  if (error.status !== 422) return null
  return error.details?.field_errors ?? null
}
