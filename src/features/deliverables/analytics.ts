import { useEffect } from 'react'
import type { RefObject } from 'react'

import { postAnalyticsEvent } from '#/shared/analytics/postEvent'
import type { ChangeCategory } from './api/requestChanges'
import type { OfferMode } from '#/features/offers/types'

type RoundResolution = 'approved' | 'another_round'
type FinalOutcome = 'approved' | 'open'
type LinkPreviewOutcome = 'title_and_thumbnail' | 'url_only' | 'failed'

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
  request_changes_modal_opened: {
    actor_kind: 'brand'
    offer_mode: OfferMode
    deliverable_index: number
    draft_version: number
  }
  request_changes_modal_dismissed: {
    actor_kind: 'brand'
    time_in_modal_seconds: number
  }
  change_request_submitted: {
    actor_kind: 'brand'
    offer_mode: OfferMode
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
    offer_mode: OfferMode
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
  link_submit_opened: {
    deliverable_id: string
    platform: string
    is_resubmission?: boolean
  }
  link_preview_resolved: {
    deliverable_id: string
    link_id: string
    platform: string
    outcome: LinkPreviewOutcome
    is_resubmission?: boolean
  }
  link_card_seen: {
    deliverable_id: string
    link_id: string
    platform: string
    outcome?: LinkPreviewOutcome
  }
  link_url_clicked: {
    deliverable_id: string
    link_id: string
    platform: string
    outcome?: LinkPreviewOutcome
  }
}

export type DeliverableEventName = keyof DeliverableEventMap

function postLegacyDeliverableAnalyticsEvent<
  TEvent extends DeliverableEventName,
>(_name: TEvent, _payload: DeliverableEventMap[TEvent]): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function trackUploadStarted(
  payload: DeliverableEventMap['upload_started'],
): void {
  postLegacyDeliverableAnalyticsEvent('upload_started', payload)
}

export function trackUploadProgress(
  payload: DeliverableEventMap['upload_progress'],
): void {
  postLegacyDeliverableAnalyticsEvent('upload_progress', payload)
}

export function trackUploadCompleted(
  payload: DeliverableEventMap['upload_completed'],
): void {
  postLegacyDeliverableAnalyticsEvent('upload_completed', payload)
}

export function trackUploadFailed(
  payload: DeliverableEventMap['upload_failed'],
): void {
  postLegacyDeliverableAnalyticsEvent('upload_failed', payload)
}

export function trackDraftSubmittedCardSeen(
  payload: DeliverableEventMap['draft_submitted_card_seen'],
): void {
  postLegacyDeliverableAnalyticsEvent('draft_submitted_card_seen', payload)
}

export function trackDraftPlayerPlayed(
  payload: DeliverableEventMap['draft_player_played'],
): void {
  postLegacyDeliverableAnalyticsEvent('draft_player_played', payload)
}

export function trackDraftApproved(
  payload: DeliverableEventMap['draft_approved'],
): void {
  postLegacyDeliverableAnalyticsEvent('draft_approved', payload)
}

export function trackRequestChangesModalOpened(
  payload: DeliverableEventMap['request_changes_modal_opened'],
): void {
  postLegacyDeliverableAnalyticsEvent('request_changes_modal_opened', payload)
}

export function trackRequestChangesModalDismissed(
  payload: DeliverableEventMap['request_changes_modal_dismissed'],
): void {
  postLegacyDeliverableAnalyticsEvent(
    'request_changes_modal_dismissed',
    payload,
  )
}

export function trackChangeRequestSubmitted(
  payload: DeliverableEventMap['change_request_submitted'],
): void {
  postLegacyDeliverableAnalyticsEvent('change_request_submitted', payload)
}

export function trackRequestChangesCardSeen(
  payload: DeliverableEventMap['request_changes_card_seen'],
): void {
  postLegacyDeliverableAnalyticsEvent('request_changes_card_seen', payload)
}

export function trackDraftV2UploadStarted(
  payload: DeliverableEventMap['draft_v2_upload_started'],
): void {
  postLegacyDeliverableAnalyticsEvent('draft_v2_upload_started', payload)
}

export function trackTimeToResolveRound(
  payload: DeliverableEventMap['time_to_resolve_round'],
): void {
  postLegacyDeliverableAnalyticsEvent('time_to_resolve_round', payload)
}

export function trackDeliverableTotalRounds(
  payload: DeliverableEventMap['deliverable_total_rounds'],
): void {
  postLegacyDeliverableAnalyticsEvent('deliverable_total_rounds', payload)
}

export function trackLinkSubmitOpened(
  payload: DeliverableEventMap['link_submit_opened'],
): void {
  postAnalyticsEvent('link_submit_opened', payload)
}

export function trackLinkPreviewResolved(
  payload: DeliverableEventMap['link_preview_resolved'],
): void {
  postAnalyticsEvent('link_preview_resolved', payload)
}

export function trackLinkCardSeen(
  payload: DeliverableEventMap['link_card_seen'],
): void {
  postAnalyticsEvent('link_card_seen', payload)
}

export function trackLinkUrlClicked(
  payload: DeliverableEventMap['link_url_clicked'],
): void {
  postAnalyticsEvent('link_url_clicked', payload)
}

export function useTrackOnceVisible(
  ref: RefObject<Element | null>,
  key: string | null,
  onVisible: () => void,
  threshold = 0.5,
): void {
  useEffect(() => {
    const node = ref.current
    if (!node || !key || isVisibilityKeyTracked(key)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some(
          (entry) =>
            entry.isIntersecting && entry.intersectionRatio >= threshold,
        )
        if (!isVisible || isVisibilityKeyTracked(key)) return

        markVisibilityKeyTracked(key)
        onVisible()
        observer.disconnect()
      },
      { threshold },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [key, onVisible, ref, threshold])
}

function isVisibilityKeyTracked(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function markVisibilityKeyTracked(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {}
}
