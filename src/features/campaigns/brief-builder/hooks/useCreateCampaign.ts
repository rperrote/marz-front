import { useMutation } from '@tanstack/react-query'
import { createCampaign } from '#/shared/api/generated/campaigns/campaigns'
import type {
  BriefHardFilter,
  BriefScoringDimension,
  CampaignBriefInput,
  CreateCampaignRequest,
  CreateCampaignRequestObjective,
  CreateCampaignResponse,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import type { BriefDraft, HardFilter, ScoringDimension } from '../store'

interface CreateCampaignParams {
  brandWorkspaceId: string
  idempotencyKey: string
  draft: BriefDraft
}

function toApiHardFilter(filter: HardFilter): BriefHardFilter {
  return {
    field: filter.filter_type,
    operator: 'eq',
    value: filter.filter_value,
  }
}

function toApiScoringDimension(
  dimension: ScoringDimension,
): BriefScoringDimension {
  return {
    name: dimension.name,
    weight_pct: dimension.weight_pct,
  }
}

function toApiBrief(draft: BriefDraft): CampaignBriefInput {
  return {
    brief_source_url: '',
    icp_description: draft.brief.icp_description,
    icp_age_min: draft.brief.icp_age_min,
    icp_age_max: draft.brief.icp_age_max,
    icp_genders: draft.brief.icp_genders,
    icp_countries: draft.brief.icp_countries,
    icp_platforms: draft.brief.icp_platforms,
    icp_interests: draft.brief.icp_interests,
    scoring_dimensions: draft.brief.scoring_dimensions.map(
      toApiScoringDimension,
    ),
    hard_filters: draft.brief.hard_filters.map(toApiHardFilter),
    disqualifiers: draft.brief.disqualifiers,
  }
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (params: CreateCampaignParams) => {
      const { draft, brandWorkspaceId, idempotencyKey } = params
      const body: CreateCampaignRequest = {
        brand_workspace_id: brandWorkspaceId,
        name: draft.campaign.name,
        objective: draft.campaign.objective as CreateCampaignRequestObjective,
        budget_amount: String(draft.campaign.budget_amount ?? ''),
        budget_currency: draft.campaign.budget_currency,
        deadline: draft.campaign.deadline || undefined,
        brief: toApiBrief(draft),
      }
      const result = (await createCampaign(body, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })) as { data: CreateCampaignResponse }
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
