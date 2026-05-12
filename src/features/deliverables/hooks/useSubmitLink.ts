import { useMutation, useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'

import { ApiError, customFetch } from '#/shared/api/mutator'
import type { PublishedLink } from '#/features/deliverables/types'

// El endpoint vive en /v1/links con deliverable_id en el body. Cuando esté en
// el spec, migrar a Orval con pnpm api:sync.

export interface SubmitLinkBody {
  url: string
}

export interface SubmitLinkResponse {
  link: Omit<PublishedLink, 'preview'> & {
    preview?: PublishedLink['preview']
  }
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

  return useMutation<
    SubmitLinkMutationResponse,
    Error,
    SubmitLinkMutationParams
  >({
    mutationFn: ({ deliverableId, body, idempotencyKey }) =>
      customFetch<SubmitLinkMutationResponse>(`/v1/links`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ ...body, deliverable_id: deliverableId }),
      }),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['deliverable', variables.deliverableId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['deliverable', variables.deliverableId, 'links'],
        }),
      ])
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
