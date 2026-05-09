import { useMutation } from '@tanstack/react-query'

import { exportBrandPaymentsCsv } from '../api/exportBrandPaymentsCsv'
import { normalizeBrandPaymentsFilters } from '../api/brandPaymentsSchemas'
import type { BrandPaymentsSearch } from '../api/brandPaymentsSchemas'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'

export interface ExportBrandPaymentsCsvVariables {
  filters: BrandPaymentsSearch
}

export function useExportBrandPaymentsCsvMutation() {
  const { brandWorkspace } = useBrandSession()
  const workspaceId = brandWorkspace.id

  return useMutation<Response, Error, ExportBrandPaymentsCsvVariables>({
    mutationFn: ({ filters }) =>
      exportBrandPaymentsCsv({
        data: {
          ...normalizeBrandPaymentsFilters(filters),
          workspaceId,
        },
      }),
    retry: false,
  })
}
