import { useMutation } from '@tanstack/react-query'

import { exportCreatorEarningsCSV } from '#/shared/api/generated/creator/creator'
import type { ExportCreatorEarningsCSVParams } from '#/shared/api/generated/model'

export interface ExportCreatorEarningsResult {
  blob: Blob
  truncated: boolean
}

function isTruncated(headers: Headers): boolean {
  const value = headers.get('X-Truncated')
  return value?.toLowerCase() === 'true'
}

export function useExportCreatorEarningsMutation() {
  return useMutation<
    ExportCreatorEarningsResult,
    Error,
    ExportCreatorEarningsCSVParams
  >({
    mutationFn: async (params) => {
      const response = await exportCreatorEarningsCSV(params, {
        headers: { Accept: 'text/csv' },
      })

      if (response.status !== 200) {
        throw new Error('Unexpected creator earnings export response')
      }

      return {
        blob: new Blob([response.data], { type: 'text/csv;charset=utf-8' }),
        truncated: isTruncated(response.headers),
      }
    },
  })
}
