import { createServerFn } from '@tanstack/react-start'

import { getCreatorAuthorizationHeaders } from './_auth'
import type { SerializableJson } from './_auth'
import { getCreatorCampaignBoardDetail as getCreatorCampaignBoardDetailRequest } from '#/shared/api/generated/creator/creator'
import type { getCreatorCampaignBoardDetailResponse } from '#/shared/api/generated/creator/creator'
import type { CreatorCampaignBoardDetailResponse } from '#/shared/api/generated/model'

function validateCampaignId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid campaign id')
  }

  return value
}

function unwrapCampaignBoardDetailResponse(
  response: getCreatorCampaignBoardDetailResponse,
): CreatorCampaignBoardDetailResponse {
  if (response.status === 200) return response.data
  throw new Error('Unexpected campaign board detail response')
}

const getCreatorCampaignBoardDetailServerFn = createServerFn({ method: 'GET' })
  .inputValidator(validateCampaignId)
  .handler(async ({ data }): Promise<SerializableJson> => {
    const response = await getCreatorCampaignBoardDetailRequest(data, {
      headers: await getCreatorAuthorizationHeaders(),
    })

    // RAFITA:ANY: createServerFn no infiere el tipo de retorno del handler; cast manual necesario para exponer el tipo correcto al consumer.
    return unwrapCampaignBoardDetailResponse(
      response,
    ) as unknown as SerializableJson
  })

export const getCreatorCampaignBoardDetail =
  // RAFITA:ANY: createServerFn no infiere el tipo de retorno del handler; cast manual necesario para exponer el tipo correcto al consumer.
  getCreatorCampaignBoardDetailServerFn as unknown as (options: {
    data: string
  }) => Promise<CreatorCampaignBoardDetailResponse>
