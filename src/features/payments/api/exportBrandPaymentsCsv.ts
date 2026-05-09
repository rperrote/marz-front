import { createServerFn } from '@tanstack/react-start'

import {
  exportBrandPaymentsCsvInputSchema,
  toBrandPaymentsQueryParams,
} from './brandPaymentsSchemas'
import { brandPaymentsServerFetch } from './serverFetch'

export const exportBrandPaymentsCsv = createServerFn({ method: 'GET' })
  .inputValidator(exportBrandPaymentsCsvInputSchema)
  .handler(async ({ data }): Promise<Response> => {
    const params = toBrandPaymentsQueryParams(data)
    const res = await brandPaymentsServerFetch(
      `/v1/brand/workspace/payments/export.csv?${params.toString()}`,
      data.workspaceId,
      { headers: { Accept: 'text/csv' } },
    )

    return new Response(await res.text(), {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/csv',
        'Content-Disposition':
          res.headers.get('content-disposition') ??
          'attachment; filename="brand-payments.csv"',
      },
    })
  })
