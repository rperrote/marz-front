import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGetBriefProcessingQueryKey,
  initBriefBuilder,
} from '#/shared/api/generated/campaigns/campaigns'
import type { BriefBuilderInitResponse } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

interface InitBriefBuilderParams {
  brandWorkspaceId: string
  websiteUrl: string
  descriptionText: string
  pdfFile: File | null
}

// `customFetch` (mutator) throws on non-2xx; the union with Error in the
// generated response type is defensive — runtime always reaches the 201 branch.
export function useInitBriefBuilder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      params: InitBriefBuilderParams,
    ): Promise<BriefBuilderInitResponse> => {
      const result = (await initBriefBuilder({
        brand_workspace_id: params.brandWorkspaceId,
        website_url: params.websiteUrl,
        description_text: params.descriptionText,
        pdf: params.pdfFile ?? undefined,
      })) as { data: BriefBuilderInitResponse }
      return result.data
    },
    onSuccess: (data) => {
      return queryClient.invalidateQueries({
        queryKey: getGetBriefProcessingQueryKey(data.processing_token),
      })
    },
  })
}

export function getInitErrorMessage(error: unknown): {
  message: string
  field?: string
} {
  if (!(error instanceof ApiError)) {
    return {
      message: error instanceof Error ? error.message : 'Error inesperado',
    }
  }

  if (error.status === 413) {
    return { message: 'Archivo demasiado grande (>10MB).' }
  }

  if (error.status === 422 && error.code === 'pdf_too_large') {
    return {
      message:
        'El documento contiene demasiado texto. Reducí el PDF o pegá texto.',
      field: 'pdfFile',
    }
  }

  if (error.status === 422 && error.details?.field_errors) {
    const firstField = Object.keys(error.details.field_errors)[0]
    const firstMsg = firstField
      ? error.details.field_errors[firstField]?.[0]
      : undefined
    return { message: firstMsg ?? error.message, field: firstField }
  }

  return { message: error.message }
}
