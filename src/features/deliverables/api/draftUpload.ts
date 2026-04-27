import { useMutation, useQuery } from '@tanstack/react-query'
import { customFetch, ApiError } from '#/shared/api/mutator'

// RAFITA:BLOCKER: Backend dev (localhost:8080) does not yet expose deliverable/draft
// endpoints in the OpenAPI spec. These hooks are manual stubs; replace with Orval
// generated hooks once `pnpm api:sync` pulls the extended contract.

export interface Draft {
  id: string
  deliverable_id: string
  version: number
  original_filename: string
  file_size_bytes: number
  duration_sec: number | null
  mime_type: string | null
  thumbnail_url: string | null
  playback_url: string
  playback_url_expires_at: string
  submitted_at: string
  submitted_by_account_id: string
}

export interface RequestDraftUploadResponse {
  intent_id: string
  upload_url: string
  headers: Record<string, string>
  expires_at: string
}

type ApiResponse<T> = { data: T; status: number }

export interface CompleteDraftUploadBody {
  duration_sec?: number | null
}

export interface ConversationDeliverable {
  id: string
  current_version: number
}

export function useRequestDraftUploadMutation(deliverableId: string) {
  return useMutation<ApiResponse<RequestDraftUploadResponse>, Error, void>({
    mutationFn: () =>
      customFetch<ApiResponse<RequestDraftUploadResponse>>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/drafts:request-upload`,
        { method: 'POST' },
      ),
  })
}

export function useCompleteDraftUploadMutation() {
  return useMutation<
    ApiResponse<Draft>,
    Error,
    { deliverableId: string; intentId: string; body: CompleteDraftUploadBody }
  >({
    mutationFn: ({ deliverableId, intentId, body }) =>
      customFetch<ApiResponse<Draft>>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/drafts/${encodeURIComponent(intentId)}:complete`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
  })
}

export function useCancelDraftUploadMutation() {
  return useMutation<void, Error, { deliverableId: string; intentId: string }>({
    mutationFn: ({ deliverableId, intentId }) =>
      customFetch<void>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/drafts/${encodeURIComponent(intentId)}`,
        { method: 'DELETE' },
      ),
  })
}

export function useApproveDraftMutation(deliverableId: string) {
  return useMutation<ApiResponse<void>, Error, void>({
    mutationFn: () =>
      customFetch<ApiResponse<void>>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/approve`,
        { method: 'POST' },
      ),
  })
}

export function useGetConversationDeliverablesQuery(conversationId: string) {
  return useQuery<ApiResponse<{ data: ConversationDeliverable[] }>>({
    queryKey: ['conversation-deliverables', conversationId],
    queryFn: () =>
      customFetch<ApiResponse<{ data: ConversationDeliverable[] }>>(
        `/v1/conversations/${encodeURIComponent(conversationId)}/deliverables`,
      ),
    enabled: !!conversationId,
  })
}

export type UploadErrorKind =
  | 'format'
  | 'size'
  | 'network'
  | 'server'
  | 'cancelled'
  | 's3_size_mismatch'
  | 's3_object_missing'

export interface UploadError {
  kind: UploadErrorKind
  message: string
}

export function apiErrorToUploadError(error: unknown): UploadError {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'invalid_format':
      case 'unsupported_mime_type':
        return { kind: 'format', message: error.message }
      case 'file_too_large':
        return { kind: 'size', message: error.message }
      case 's3_size_mismatch':
        return { kind: 's3_size_mismatch', message: error.message }
      case 's3_object_missing':
        return { kind: 's3_object_missing', message: error.message }
      default:
        if (error.status >= 500) {
          return { kind: 'server', message: error.message }
        }
        return { kind: 'network', message: error.message }
    }
  }

  if (error instanceof Error) {
    return { kind: 'network', message: error.message }
  }

  return { kind: 'server', message: 'Something went wrong. Try again.' }
}
