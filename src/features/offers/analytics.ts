// Analytics soft-disabled: backend endpoint not yet defined in OpenAPI.
// Re-enable by routing through the Orval-generated client once the endpoint exists.

import type { OfferMode } from './types'

type AmountBucket =
  | '<500'
  | '500-1000'
  | '1000-2500'
  | '2500-5000'
  | '5000-10000'
  | '>10000'

export type ArchiveSizeBucket = '<5' | '5-10' | '10-20' | '20-50' | '>50'

export type ActorKind = 'brand' | 'creator'

interface OfferSentPayload {
  actor_kind: 'brand'
  offer_mode: OfferMode
  platform_mix: string[]
  has_bonus_terms: boolean
  total_amount_bucket: AmountBucket
  deadline_days_from_now: number
  deliverables_count?: number
}

interface OfferEventMap {
  offer_sidesheet_opened: {
    actor_kind: 'brand'
    source: 'conversation'
  }
  offer_sent: OfferSentPayload
  offer_received_seen: {
    actor_kind: 'creator'
    offer_mode: OfferMode
    offer_age_seconds: number
  }
  offer_accepted: {
    actor_kind: 'creator'
    offer_mode: OfferMode
    time_to_response_seconds: number
  }
  offer_rejected: {
    actor_kind: 'creator'
    offer_mode: OfferMode
    time_to_response_seconds: number
  }
  offer_expired: {
    actor_kind: ActorKind
    offer_mode: OfferMode
  }
  offer_panel_viewed: {
    actor_kind: ActorKind
    offer_state: 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  }
  offer_archive_expanded: {
    actor_kind: ActorKind
    archive_size_bucket: ArchiveSizeBucket
  }
  offer_expired_seen: {
    actor_kind: ActorKind
    offer_age_days_at_seen: number
  }
}

export type OfferEventName = keyof OfferEventMap

export function trackOfferEvent<TEvent extends OfferEventName>(
  _name: TEvent,
  _payload: OfferEventMap[TEvent],
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function toArchiveSizeBucket(size: number): ArchiveSizeBucket {
  if (size < 5) return '<5'
  if (size < 10) return '5-10'
  if (size < 20) return '10-20'
  if (size < 50) return '20-50'
  return '>50'
}
