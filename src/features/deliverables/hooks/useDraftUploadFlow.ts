import { useCallback, useRef, useState } from 'react'

import {
  useRequestDraftUploadMutation,
  useCompleteDraftUploadMutation,
  useCancelDraftUploadMutation,
  apiErrorToUploadError,
} from '#/features/deliverables/api/draftUpload'
import type {
  Draft,
  UploadError,
} from '#/features/deliverables/api/draftUpload'
import {
  trackUploadStarted,
  trackUploadProgress,
  trackUploadCompleted,
  trackUploadFailed,
  trackDraftV2UploadStarted,
} from '#/features/deliverables/analytics'
import type { DeliverableDTO, OfferType } from '#/features/deliverables/types'

type UploadStatus =
  | 'idle'
  | 'requesting'
  | 'uploading'
  | 'completing'
  | 'done'
  | 'cancelled'
  | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  error: UploadError | null
  intentId: string | null
  draft: Draft | null
}

interface DraftV2UploadAnalytics {
  offerType: OfferType
  deliverableIndex: number
  deliverableStatus: DeliverableDTO['status']
  currentVersion: number | null
  latestChangeRequestedAt: string | null
}

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.preload = 'metadata'

    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.onloadedmetadata = null
      video.onerror = null
      video.src = ''
    }

    video.onloadedmetadata = () => {
      const duration = video.duration
      cleanup()
      if (Number.isFinite(duration) && !Number.isNaN(duration)) {
        resolve(duration)
      } else {
        resolve(null)
      }
    }

    video.onerror = () => {
      cleanup()
      resolve(null)
    }

    video.src = url
  })
}

export function useDraftUploadFlow(
  deliverableId: string,
  analytics?: DraftV2UploadAnalytics,
) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    error: null,
    intentId: null,
    draft: null,
  })

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const intentIdRef = useRef<string | null>(null)
  const seenMilestonesRef = useRef<Set<number>>(new Set())
  const startedAtRef = useRef<number>(0)

  const requestMutation = useRequestDraftUploadMutation(deliverableId)
  const completeMutation = useCompleteDraftUploadMutation()
  const cancelMutation = useCancelDraftUploadMutation()

  const reset = useCallback(() => {
    xhrRef.current?.abort()
    xhrRef.current = null
    intentIdRef.current = null
    seenMilestonesRef.current.clear()
    startedAtRef.current = 0
    setState({
      status: 'idle',
      progress: 0,
      error: null,
      intentId: null,
      draft: null,
    })
  }, [])

  const cancel = useCallback(() => {
    const xhr = xhrRef.current
    if (xhr) {
      xhr.abort()
      xhrRef.current = null
    }

    const currentIntentId = intentIdRef.current
    if (currentIntentId) {
      // Best-effort cancellation on the server side.
      cancelMutation.mutate({ deliverableId, intentId: currentIntentId })
    }

    setState((prev) => ({
      ...prev,
      status: 'cancelled',
      progress: 0,
      error: null,
    }))
  }, [cancelMutation, deliverableId])

  const start = useCallback(
    async (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setState({
          status: 'error',
          progress: 0,
          error: {
            kind: 'format',
            message: "This file format isn't supported. Use MP4, MOV, or WebM.",
          },
          intentId: null,
          draft: null,
        })
        trackUploadFailed({ deliverable_id: deliverableId, reason: 'format' })
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setState({
          status: 'error',
          progress: 0,
          error: {
            kind: 'size',
            message: 'File too large (max 2 GB).',
          },
          intentId: null,
          draft: null,
        })
        trackUploadFailed({ deliverable_id: deliverableId, reason: 'size' })
        return
      }

      startedAtRef.current = Date.now()
      seenMilestonesRef.current.clear()
      trackUploadStarted({
        deliverable_id: deliverableId,
        file_size_bytes: file.size,
        content_type: file.type,
      })
      if (
        analytics?.deliverableStatus === 'changes_requested' &&
        analytics.latestChangeRequestedAt != null
      ) {
        trackDraftV2UploadStarted({
          actor_kind: 'creator',
          offer_type: analytics.offerType,
          deliverable_index: analytics.deliverableIndex,
          draft_version: (analytics.currentVersion ?? 0) + 1,
          time_from_request_to_upload_seconds: Math.max(
            0,
            (Date.now() - Date.parse(analytics.latestChangeRequestedAt)) / 1000,
          ),
        })
      }

      setState({
        status: 'requesting',
        progress: 0,
        error: null,
        intentId: null,
        draft: null,
      })

      let intent: {
        intent_id: string
        upload_url: string
        headers: Record<string, string>
      }

      try {
        const response = await requestMutation.mutateAsync()
        intent = {
          intent_id: response.data.intent_id,
          upload_url: response.data.upload_url,
          headers: response.data.headers,
        }
      } catch (err) {
        const error = apiErrorToUploadError(err)
        setState({
          status: 'error',
          progress: 0,
          error,
          intentId: null,
          draft: null,
        })
        trackUploadFailed({ deliverable_id: deliverableId, reason: error.kind })
        return
      }

      intentIdRef.current = intent.intent_id
      setState((prev) => ({
        ...prev,
        status: 'uploading',
        intentId: intent.intent_id,
      }))

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setState((prev) => ({ ...prev, progress: percent }))

          const milestone: 25 | 50 | 75 | null =
            percent >= 75 ? 75 : percent >= 50 ? 50 : percent >= 25 ? 25 : null

          if (milestone && !seenMilestonesRef.current.has(milestone)) {
            seenMilestonesRef.current.add(milestone)
            trackUploadProgress({
              deliverable_id: deliverableId,
              milestone,
            })
          }
        }
      }

      xhr.onload = async () => {
        xhrRef.current = null
        if (xhr.status < 200 || xhr.status >= 300) {
          setState({
            status: 'error',
            progress: 0,
            error: {
              kind: 'network',
              message: 'Upload failed. Check your connection and try again.',
            },
            intentId: intent.intent_id,
            draft: null,
          })
          trackUploadFailed({
            deliverable_id: deliverableId,
            reason: 'network',
          })
          return
        }

        setState((prev) => ({ ...prev, status: 'completing' }))

        let durationSec: number | null = null
        try {
          durationSec = await readVideoDuration(file)
        } catch {
          durationSec = null
        }

        try {
          const completeRes = await completeMutation.mutateAsync({
            deliverableId,
            intentId: intent.intent_id,
            body: { duration_sec: durationSec },
          })

          trackUploadCompleted({
            deliverable_id: deliverableId,
            draft_id: completeRes.data.id,
            version: completeRes.data.version,
            duration_ms: Date.now() - startedAtRef.current,
          })

          setState({
            status: 'done',
            progress: 100,
            error: null,
            intentId: intent.intent_id,
            draft: completeRes.data,
          })
        } catch (err) {
          const error = apiErrorToUploadError(err)
          setState({
            status: 'error',
            progress: 0,
            error,
            intentId: intent.intent_id,
            draft: null,
          })
          trackUploadFailed({
            deliverable_id: deliverableId,
            reason: error.kind,
          })
        }
      }

      xhr.onerror = () => {
        xhrRef.current = null
        setState({
          status: 'error',
          progress: 0,
          error: {
            kind: 'network',
            message: 'Upload failed. Check your connection and try again.',
          },
          intentId: intent.intent_id,
          draft: null,
        })
        trackUploadFailed({
          deliverable_id: deliverableId,
          reason: 'network',
        })
      }

      xhr.onabort = () => {
        xhrRef.current = null
        setState((prev) =>
          prev.status === 'cancelled'
            ? prev
            : {
                status: 'cancelled',
                progress: 0,
                error: null,
                intentId: intent.intent_id,
                draft: null,
              },
        )
        trackUploadFailed({
          deliverable_id: deliverableId,
          reason: 'cancelled',
        })
      }

      xhr.open('PUT', intent.upload_url)
      Object.entries(intent.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })
      xhr.send(file)
    },
    [analytics, completeMutation, deliverableId, requestMutation],
  )

  return {
    status: state.status,
    progress: state.progress,
    error: state.error,
    draft: state.draft,
    start,
    cancel,
    reset,
  }
}
