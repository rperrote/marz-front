import { customFetch } from '#/shared/api/mutator'
import type { ChangeCategory } from './api/requestChanges'
import type { OfferType } from './types'

type RoundResolution = 'approved' | 'another_round'
type FinalOutcome = 'approved' | 'open'

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
  request_changes_modal_opened: {
    actor_kind: 'brand'
    offer_type: OfferType
    deliverable_index: number
    draft_version: number
  }
  request_changes_modal_dismissed: {
    actor_kind: 'brand'
    time_in_modal_seconds: number
  }
  change_request_submitted: {
    actor_kind: 'brand'
    offer_type: OfferType
    deliverable_index: number
    draft_version: number
    categories: ChangeCategory[]
    categories_count: number
    has_notes: boolean
    round_index: number
  }
  request_changes_card_seen: {
    actor_kind: 'creator'
    time_since_request_seconds: number
  }
  draft_v2_upload_started: {
    actor_kind: 'creator'
    offer_type: OfferType
    deliverable_index: number
    draft_version: number
    time_from_request_to_upload_seconds: number
  }
  time_to_resolve_round: {
    deliverable_index: number
    round_index: number
    resolution: RoundResolution
    round_duration_seconds: number
  }
  deliverable_total_rounds: {
    deliverable_index: number
    total_rounds: number
    final_outcome: FinalOutcome
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

export function trackRequestChangesModalOpened(
  payload: DeliverableEventMap['request_changes_modal_opened'],
): void {
  postAnalyticsEvent('request_changes_modal_opened', payload)
}

export function trackRequestChangesModalDismissed(
  payload: DeliverableEventMap['request_changes_modal_dismissed'],
): void {
  postAnalyticsEvent('request_changes_modal_dismissed', payload)
}

export function trackChangeRequestSubmitted(
  payload: DeliverableEventMap['change_request_submitted'],
): void {
  postAnalyticsEvent('change_request_submitted', payload)
}

export function trackRequestChangesCardSeen(
  payload: DeliverableEventMap['request_changes_card_seen'],
): void {
  postAnalyticsEvent('request_changes_card_seen', payload)
}

export function trackDraftV2UploadStarted(
  payload: DeliverableEventMap['draft_v2_upload_started'],
): void {
  postAnalyticsEvent('draft_v2_upload_started', payload)
}

export function trackTimeToResolveRound(
  payload: DeliverableEventMap['time_to_resolve_round'],
): void {
  postAnalyticsEvent('time_to_resolve_round', payload)
}

export function trackDeliverableTotalRounds(
  payload: DeliverableEventMap['deliverable_total_rounds'],
): void {
  postAnalyticsEvent('deliverable_total_rounds', payload)
}
