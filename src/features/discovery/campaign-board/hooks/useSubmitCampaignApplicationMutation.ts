import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey, UseMutationOptions } from '@tanstack/react-query'

import { submitCampaignApplication } from '#/features/discovery/campaign-board/api/submitCampaignApplication'
import type {
  CreatorCampaignBoardApplication,
  CreatorCampaignBoardCard,
  CreatorCampaignBoardDetailResponse,
  CreatorCampaignBoardResponse,
  SubmitCampaignApplicationRequest,
  SubmitCampaignApplicationResponse,
} from '#/shared/api/generated/model'

import { campaignBoardDetailQueryKey } from './useCampaignBoardDetailQuery'
import { generateIdempotencyKey } from '../utils/idempotencyKey'

export interface SubmitCampaignApplicationVariables {
  campaignId: string
  data: SubmitCampaignApplicationRequest
  idempotencyKey?: string
}

export interface SubmitCampaignApplicationMutationResult {
  data: SubmitCampaignApplicationResponse
  idempotencyKey: string
}

type SubmitCampaignApplicationMutationOptions = Omit<
  UseMutationOptions<
    SubmitCampaignApplicationMutationResult,
    Error,
    SubmitCampaignApplicationVariables
  >,
  'mutationFn' | 'onSuccess'
> & {
  onSuccess?: (
    data: SubmitCampaignApplicationMutationResult,
    variables: SubmitCampaignApplicationVariables,
  ) => void | Promise<void>
}

function isCampaignBoardListQueryKey(queryKey: QueryKey): boolean {
  return (
    queryKey[0] === 'discovery' &&
    queryKey[1] === 'campaign-board' &&
    queryKey[2] !== 'detail'
  )
}

function applicationPatchFromResponse(
  response: SubmitCampaignApplicationResponse,
): CreatorCampaignBoardApplication {
  return {
    status: response.application.status,
    application_id: response.application.application_id,
    submitted_at: response.application.submitted_at,
    can_apply: false,
  }
}

function hasCardPatch(
  value: unknown,
): value is { card_patch: Partial<CreatorCampaignBoardCard> } {
  if (typeof value !== 'object' || value === null) return false
  if (!('card_patch' in value)) return false

  const cardPatch = value.card_patch
  return typeof cardPatch === 'object' && cardPatch !== null
}

function cardPatchFromResponse(
  response: SubmitCampaignApplicationResponse,
): Partial<CreatorCampaignBoardCard> {
  if (hasCardPatch(response)) return response.card_patch

  return {
    application: applicationPatchFromResponse(response),
  }
}

function patchCampaignBoardCard(
  card: CreatorCampaignBoardCard,
  campaignId: string,
  patch: Partial<CreatorCampaignBoardCard>,
): CreatorCampaignBoardCard {
  if (card.campaign_id !== campaignId) return card

  return {
    ...card,
    ...patch,
    application: patch.application ?? card.application,
  }
}

function patchCampaignBoardList(
  previous: CreatorCampaignBoardResponse | undefined,
  campaignId: string,
  patch: Partial<CreatorCampaignBoardCard>,
): CreatorCampaignBoardResponse | undefined {
  if (!previous) return previous

  return {
    ...previous,
    data: previous.data.map((card) =>
      patchCampaignBoardCard(card, campaignId, patch),
    ),
  }
}

function patchCampaignBoardDetail(
  previous: CreatorCampaignBoardDetailResponse | undefined,
  campaignId: string,
  patch: Partial<CreatorCampaignBoardCard>,
): CreatorCampaignBoardDetailResponse | undefined {
  if (!previous) return previous

  return {
    ...previous,
    card: patchCampaignBoardCard(previous.card, campaignId, patch),
    application: patch.application ?? previous.application,
  }
}

export function useSubmitCampaignApplicationMutation(
  options?: SubmitCampaignApplicationMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: async (
      variables,
    ): Promise<SubmitCampaignApplicationMutationResult> => {
      const idempotencyKey =
        variables.idempotencyKey ?? generateIdempotencyKey()
      const data = await submitCampaignApplication({
        data: {
          campaignId: variables.campaignId,
          data: variables.data,
          idempotencyKey,
        },
      })

      return { data, idempotencyKey }
    },
    onSuccess: async (data, variables) => {
      const cardPatch = cardPatchFromResponse(data.data)

      queryClient.setQueriesData<CreatorCampaignBoardResponse>(
        { predicate: (query) => isCampaignBoardListQueryKey(query.queryKey) },
        (previous) =>
          patchCampaignBoardList(previous, variables.campaignId, cardPatch),
      )
      queryClient.setQueryData<CreatorCampaignBoardDetailResponse>(
        campaignBoardDetailQueryKey(variables.campaignId),
        (previous) =>
          patchCampaignBoardDetail(previous, variables.campaignId, cardPatch),
      )

      await queryClient.invalidateQueries({
        queryKey: ['discovery', 'campaign-board'],
      })
      await options?.onSuccess?.(data, variables)
    },
  })
}
