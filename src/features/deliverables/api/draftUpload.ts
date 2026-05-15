import { t } from '@lingui/core/macro'

import { ApiError } from '#/shared/api/mutator'
import type { DraftDTO } from '#/shared/api/generated/model'
import {
  useRequestDraftUpload,
  useCompleteDraftUpload,
  useCancelDraftUpload,
  useApproveDraft as useApproveDraftGenerated,
} from '#/shared/api/generated/deliverables/deliverables'
import type {
  requestDraftUploadResponseSuccess,
  completeDraftUploadResponseSuccess,
  approveDraftResponseSuccess,
  cancelDraftUploadResponseSuccess,
} from '#/shared/api/generated/deliverables/deliverables'

export type Draft = DraftDTO

export type { RequestDraftUploadResponse } from '#/shared/api/generated/model'

export interface CompleteDraftUploadBody {
  duration_sec?: number | null
}

export function useRequestDraftUploadMutation(deliverableId: string) {
  const mutation = useRequestDraftUpload()
  return {
    ...mutation,
    mutateAsync: (vars: {
      filename: string
      size_bytes: number
      content_type: 'video/mp4' | 'video/quicktime' | 'video/webm'
    }) =>
      mutation.mutateAsync({
        id: deliverableId,
        data: {
          filename: vars.filename,
          size_bytes: vars.size_bytes,
          content_type: vars.content_type,
        },
      }) as Promise<requestDraftUploadResponseSuccess>,
  }
}

export function useCompleteDraftUploadMutation() {
  const mutation = useCompleteDraftUpload()
  return {
    ...mutation,
    mutateAsync: (vars: {
      deliverableId: string
      intentId: string
      body: CompleteDraftUploadBody
    }) =>
      mutation.mutateAsync({
        id: vars.deliverableId,
        intentId: vars.intentId,
        data: { duration_sec: vars.body.duration_sec },
      }) as Promise<completeDraftUploadResponseSuccess>,
  }
}

export function useCancelDraftUploadMutation() {
  const mutation = useCancelDraftUpload()
  return {
    ...mutation,
    mutate: (vars: { deliverableId: string; intentId: string }) =>
      mutation.mutate({ id: vars.deliverableId, intentId: vars.intentId }),
  }
}

export function useApproveDraftMutation(deliverableId: string) {
  const mutation = useApproveDraftGenerated()
  return {
    ...mutation,
    mutate: (
      _vars: void | undefined,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ id: deliverableId }, options),
    mutateAsync: (_vars?: void) =>
      mutation.mutateAsync({
        id: deliverableId,
      }) as Promise<approveDraftResponseSuccess>,
  }
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

  return { kind: 'server', message: t`Something went wrong. Try again.` }
}

export type { cancelDraftUploadResponseSuccess }
