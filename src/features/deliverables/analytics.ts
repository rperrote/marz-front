import { customFetch } from '#/shared/api/mutator'

interface DeliverableEventMap {
  upload_started: {
    deliverable_id: string
    file_size_bytes: number
    content_type: string
  }
  upload_progress: {
    deliverable_id: string
    milestone: 25 | 50 | 75
  }
  upload_completed: {
    deliverable_id: string
    draft_id: string
    version: number
    duration_ms: number
  }
  upload_failed: {
    deliverable_id: string
    reason: string
  }
  draft_submitted_card_seen: {
    message_id: string
    deliverable_id: string
    version: number
  }
  draft_player_played: {
    deliverable_id: string
    draft_id: string
  }
  draft_approved: {
    deliverable_id: string
    draft_id: string
    version: number
  }
  multistage_stage_unlocked: {
    offer_id: string
    stage_id: string
    position: number
  }
}

export type DeliverableEventName = keyof DeliverableEventMap

const ANALYTICS_PATH = '/api/v1/analytics/events'

function postAnalyticsEvent<TEvent extends DeliverableEventName>(
  name: TEvent,
  payload: DeliverableEventMap[TEvent],
): void {
  const event = {
    event_name: name,
    properties: { ...payload },
    occurred_at: new Date().toISOString(),
  }
  void customFetch(ANALYTICS_PATH, {
    method: 'POST',
    body: JSON.stringify(event),
  }).catch(() => {
    /* fire-and-forget: analytics errors must never break UX */
  })
}

export function trackUploadStarted(
  payload: DeliverableEventMap['upload_started'],
): void {
  postAnalyticsEvent('upload_started', payload)
}

export function trackUploadProgress(
  payload: DeliverableEventMap['upload_progress'],
): void {
  postAnalyticsEvent('upload_progress', payload)
}

export function trackUploadCompleted(
  payload: DeliverableEventMap['upload_completed'],
): void {
  postAnalyticsEvent('upload_completed', payload)
}

export function trackUploadFailed(
  payload: DeliverableEventMap['upload_failed'],
): void {
  postAnalyticsEvent('upload_failed', payload)
}

export function trackDraftSubmittedCardSeen(
  payload: DeliverableEventMap['draft_submitted_card_seen'],
): void {
  postAnalyticsEvent('draft_submitted_card_seen', payload)
}

export function trackDraftPlayerPlayed(
  payload: DeliverableEventMap['draft_player_played'],
): void {
  postAnalyticsEvent('draft_player_played', payload)
}

export function trackDraftApproved(
  payload: DeliverableEventMap['draft_approved'],
): void {
  postAnalyticsEvent('draft_approved', payload)
}

export function trackMultistageStageUnlocked(
  payload: DeliverableEventMap['multistage_stage_unlocked'],
): void {
  postAnalyticsEvent('multistage_stage_unlocked', payload)
}
