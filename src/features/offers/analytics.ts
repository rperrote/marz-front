// Analytics soft-disabled: backend endpoint not yet defined in OpenAPI.
// Re-enable by routing through the Orval-generated client once the endpoint exists.

import type { OfferMode } from './types'

export type AmountBucket =
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

const seenOfferIds = new Set<string>()

export function markOfferSeen(
  offerId: string,
  eventName: OfferEventName,
): boolean {
  const key = `${eventName}:${offerId}`
  if (seenOfferIds.has(key)) return false
  seenOfferIds.add(key)
  return true
}

export function trackOfferEvent<TEvent extends OfferEventName>(
  _name: TEvent,
  _payload: OfferEventMap[TEvent],
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function toAmountBucket(
  amount: number,
  _currency: string,
): AmountBucket {
  // RAFITA:TODO: MVP assumes 1:1 FX for non-USD currencies.
  // Replace with real FX conversion when available.
  if (amount < 500) return '<500'
  if (amount < 1000) return '500-1000'
  if (amount < 2500) return '1000-2500'
  if (amount < 5000) return '2500-5000'
  if (amount < 10000) return '5000-10000'
  return '>10000'
}

export function toArchiveSizeBucket(size: number): ArchiveSizeBucket {
  if (size < 5) return '<5'
  if (size < 10) return '5-10'
  if (size < 20) return '10-20'
  if (size < 50) return '20-50'
  return '>50'
}

export function toPlatformMix(
  deliverables: ReadonlyArray<{ platform: string }>,
): string[] {
  return [...new Set(deliverables.map((deliverable) => deliverable.platform))]
}

export function maxDeadlineFromNow(
  deadlines: readonly string[],
  now?: Date,
): number {
  const sortedDeadlines = deadlines.toSorted(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  )
  const latestDeadline = sortedDeadlines[0]
  return latestDeadline ? daysFromNow(latestDeadline, now) : 0
}

export function daysFromNow(dateString: string, now?: Date): number {
  const target = new Date(dateString)
  target.setUTCHours(0, 0, 0, 0)

  const reference = now ? new Date(now.getTime()) : new Date()
  reference.setUTCHours(0, 0, 0, 0)

  const diffMs = target.getTime() - reference.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
