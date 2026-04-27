import { customFetch } from '#/shared/api/mutator'

export type AmountBucket =
  | '<500'
  | '500-1000'
  | '1000-2500'
  | '2500-5000'
  | '5000-10000'
  | '>10000'

export type ArchiveSizeBucket = '<5' | '5-10' | '10-20' | '20-50' | '>50'

export type ActorKind = 'brand' | 'creator'

interface OfferEventMap {
  offer_sidesheet_opened: {
    actor_kind: 'brand'
    source: 'conversation'
  }
  offer_sent: {
    actor_kind: 'brand'
    offer_type: 'single'
    platform: string
    has_speed_bonus: boolean
    amount_bucket: AmountBucket
    deadline_days_from_now: number
  }
  offer_received_seen: {
    actor_kind: 'creator'
    offer_age_seconds: number
  }
  offer_accepted: {
    actor_kind: 'creator'
    time_to_response_seconds: number
  }
  offer_rejected: {
    actor_kind: 'creator'
    time_to_response_seconds: number
  }
  offer_panel_viewed: {
    actor_kind: ActorKind
    offer_state: 'sent' | 'accepted' | 'rejected' | 'expired'
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

const ANALYTICS_PATH = '/api/v1/analytics/events'

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

export function resetSeenOffers(): void {
  seenOfferIds.clear()
}

export function trackOfferEvent<TEvent extends OfferEventName>(
  name: TEvent,
  payload: OfferEventMap[TEvent],
): void {
  const event = {
    event: name,
    properties: { ...payload },
    timestamp: new Date().toISOString(),
  }
  void customFetch(ANALYTICS_PATH, {
    method: 'POST',
    body: JSON.stringify(event),
  }).catch(() => {
    /* fire-and-forget: analytics errors must never break UX */
  })
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

export function daysFromNow(dateString: string, now?: Date): number {
  const target = new Date(dateString)
  target.setUTCHours(0, 0, 0, 0)

  const reference = now ? new Date(now.getTime()) : new Date()
  reference.setUTCHours(0, 0, 0, 0)

  const diffMs = target.getTime() - reference.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
