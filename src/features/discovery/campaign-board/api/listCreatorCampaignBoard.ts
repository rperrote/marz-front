import { createServerFn } from '@tanstack/react-start'

import { getCreatorAuthorizationHeaders } from './_auth'
import type { SerializableJson } from './_auth'
import { listCreatorCampaignBoard as listCreatorCampaignBoardRequest } from '#/shared/api/generated/creator/creator'
import type { listCreatorCampaignBoardResponse } from '#/shared/api/generated/creator/creator'
import type {
  CreatorCampaignBoardResponse,
  ListCreatorCampaignBoardParams,
} from '#/shared/api/generated/model'

export function normalizeCampaignBoardSearch(
  search?: ListCreatorCampaignBoardParams,
): ListCreatorCampaignBoardParams {
  return {
    ...search,
    recommended_only: search?.recommended_only ?? false,
  }
}

function validateCampaignBoardSearch(
  value: unknown,
): ListCreatorCampaignBoardParams {
  if (value === undefined) return normalizeCampaignBoardSearch()
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid campaign board search')
  }

  return normalizeCampaignBoardSearch(value)
}

function unwrapCampaignBoardResponse(
  response: listCreatorCampaignBoardResponse,
): CreatorCampaignBoardResponse {
  if (response.status === 200) return response.data
  throw new Error('Unexpected campaign board response')
}

const listCreatorCampaignBoardServerFn = createServerFn({ method: 'GET' })
  .inputValidator(validateCampaignBoardSearch)
  .handler(async ({ data }): Promise<SerializableJson> => {
    const response = await listCreatorCampaignBoardRequest(data, {
      headers: await getCreatorAuthorizationHeaders(),
    })

    return unwrapCampaignBoardResponse(response) as unknown as SerializableJson
  })

export const listCreatorCampaignBoard =
  // RAFITA:ANY: createServerFn no infiere el tipo de retorno del handler; cast manual necesario para exponer el tipo correcto al consumer.
  listCreatorCampaignBoardServerFn as unknown as (options?: {
    data?: ListCreatorCampaignBoardParams
  }) => Promise<CreatorCampaignBoardResponse>
