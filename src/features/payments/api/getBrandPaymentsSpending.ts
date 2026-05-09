import { createServerFn } from '@tanstack/react-start'

import {
  brandPaymentsSpendingInputSchema,
  toBrandPaymentsQueryParams,
} from './brandPaymentsSchemas'
import type { BrandPaymentsSpendingResponse } from './brandPaymentsSchemas'
import { brandPaymentsServerFetch } from './serverFetch'

export const getBrandPaymentsSpending = createServerFn({ method: 'GET' })
  .inputValidator(brandPaymentsSpendingInputSchema)
  .handler(async ({ data }): Promise<BrandPaymentsSpendingResponse> => {
    const params = toBrandPaymentsQueryParams(data)
    const res = await brandPaymentsServerFetch(
      `/v1/brand-workspaces/${data.workspaceId}/payments/spending?${params.toString()}`,
      data.workspaceId,
    )

    return (await res.json()) as BrandPaymentsSpendingResponse
  })
