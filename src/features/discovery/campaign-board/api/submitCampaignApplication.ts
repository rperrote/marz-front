import { createServerFn } from '@tanstack/react-start'

import { getCreatorAuthorizationHeaders } from './_auth'
import { submitCreatorCampaignBoardApplication } from '#/shared/api/generated/creator/creator'
import type { submitCreatorCampaignBoardApplicationResponse } from '#/shared/api/generated/creator/creator'
import type {
  SubmitCampaignApplicationRequest,
  SubmitCampaignApplicationResponse,
} from '#/shared/api/generated/model'

export interface SubmitCampaignApplicationInput {
  campaignId: string
  data: SubmitCampaignApplicationRequest
  idempotencyKey: string
}

function validateSubmitCampaignApplicationInput(
  value: unknown,
): SubmitCampaignApplicationInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid campaign application input')
  }

  const candidate = value as Record<string, unknown>
  const data = candidate.data
  if (
    typeof candidate.campaignId !== 'string' ||
    candidate.campaignId.length === 0 ||
    typeof candidate.idempotencyKey !== 'string' ||
    candidate.idempotencyKey.length === 0 ||
    typeof data !== 'object' ||
    data === null ||
    !('message' in data) ||
    typeof data.message !== 'string'
  ) {
    throw new Error('Invalid campaign application input')
  }

  return {
    campaignId: candidate.campaignId,
    data: data as SubmitCampaignApplicationRequest,
    idempotencyKey: candidate.idempotencyKey,
  }
}

function unwrapSubmitCampaignApplicationResponse(
  response: submitCreatorCampaignBoardApplicationResponse,
): SubmitCampaignApplicationResponse {
  if (response.status === 200 || response.status === 201) return response.data
  throw new Error('Unexpected campaign application response')
}

export const submitCampaignApplication = createServerFn({ method: 'POST' })
  .inputValidator(validateSubmitCampaignApplicationInput)
  .handler(async ({ data }): Promise<SubmitCampaignApplicationResponse> => {
    const response = await submitCreatorCampaignBoardApplication(
      data.campaignId,
      data.data,
      {
        headers: await getCreatorAuthorizationHeaders({
          'Idempotency-Key': data.idempotencyKey,
        }),
      },
    )

    return unwrapSubmitCampaignApplicationResponse(response)
  })
