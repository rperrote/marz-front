import { useMutation } from '@tanstack/react-query'
import { customFetch, ApiError } from '#/shared/api/mutator'

interface InitBriefBuilderParams {
  brandWorkspaceId: string
  websiteUrl: string
  descriptionText: string
  pdfFile: File | null
}

interface InitBriefBuilderResponse {
  data: { processing_token: string }
  status: number
  headers: Headers
}

export function useInitBriefBuilder() {
  return useMutation({
    mutationFn: async (params: InitBriefBuilderParams) => {
      const formData = new FormData()
      formData.append('brand_workspace_id', params.brandWorkspaceId)
      formData.append('website_url', params.websiteUrl)
      formData.append('description_text', params.descriptionText)
      if (params.pdfFile) {
        formData.append('pdf_file', params.pdfFile)
      }

      const result = await customFetch<InitBriefBuilderResponse>(
        '/api/v1/campaigns/brief-builder/init',
        { method: 'POST', body: formData },
      )

      return result.data
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
