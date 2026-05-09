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
      `/v1/brand-workspaces/${data.workspaceId}/payments/spending/export.csv?${params.toString()}`,
      data.workspaceId,
      { headers: { Accept: 'text/csv' } },
    )
    const contentDisposition = res.headers.get('content-disposition')
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'text/csv',
    }
    if (contentDisposition) {
      headers['Content-Disposition'] = contentDisposition
    }

    return new Response(await res.text(), {
      status: res.status,
      headers,
    })
  })
