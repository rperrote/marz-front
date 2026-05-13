import { useMutation, useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'

import { ApiError } from '#/shared/api/mutator'
import { submitLink } from '#/shared/api/generated/deliverables/deliverables'
import { withIdempotencyKey } from '#/shared/api/idempotency'
import type {
  PublishedLink,
  PublishedLinkPreview,
  PublishedLinkStatus,
} from '#/features/deliverables/types'
import { getDeliverableLinksQueryKey } from './useDeliverableLinks'

export interface SubmitLinkBody {
  url: string
}

export interface SubmitLinkResponse {
  link: PublishedLink
}

interface SubmitLinkMutationParams {
  deliverableId: string
  body: SubmitLinkBody
  idempotencyKey: string
}

interface SubmitLinkMutationResponse {
  data: SubmitLinkResponse
  status: number
}

export function useSubmitLinkMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      params: SubmitLinkMutationParams,
    ): Promise<SubmitLinkMutationResponse> => {
      const response = await submitLink(
        { deliverable_id: params.deliverableId, url: params.body.url },
        withIdempotencyKey(params.idempotencyKey),
      )

      if (response.status !== 201) {
        throw new Error('Unexpected response')
      }

      const dto = response.data.link
      const previewDto = dto.preview
      const preview: PublishedLinkPreview = previewDto.error
        ? { outcome: 'failed' }
        : previewDto.title && previewDto.image_url
          ? {
              outcome: 'title_and_thumbnail',
              title: previewDto.title,
              thumbnail_url: previewDto.image_url,
            }
          : { outcome: 'url_only' }

      return {
        status: response.status,
        data: {
          link: {
            id: dto.id,
            deliverable_id: dto.deliverable_id,
            url: dto.url,
            status: dto.status as PublishedLinkStatus,
            preview,
            submitted_at: dto.submitted_at,
            submitted_by_account_id: dto.submitted_by_account_id,
            approved_at: dto.approved_at,
            approved_by_account_id: dto.approved_by_account_id,
          },
        },
      }
    },
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({
        queryKey: ['deliverable', params.deliverableId],
      })
      void queryClient.invalidateQueries({
        queryKey: getDeliverableLinksQueryKey(params.deliverableId),
      })
    },
  })
}

export function getSubmitLinkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.code === 'DOMAIN_NOT_ALLOWED') {
      return t`Domain not allowed. Use a YouTube, Instagram or TikTok URL.`
    }

    if (error.status === 409 && error.code === 'INVALID_DELIVERABLE_STATUS') {
      return t`This deliverable is no longer accepting links.`
    }

    if (error.status === 409 && error.code === 'STAGE_LOCKED') {
      return t`This stage is locked.`
    }

    if (error.status === 403 && error.code === 'FORBIDDEN') {
      return t`You can't submit links on this deliverable.`
    }
  }

  return t`Something went wrong. Try again.`
}
