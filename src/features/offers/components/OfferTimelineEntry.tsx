import type {
  OfferSnapshot,
  OfferAcceptedSnap,
  OfferEventType,
  ViewerSide,
} from '../types'
import { offerSnapshotSchema, offerAcceptedSnapSchema } from '../schemas'

import { OfferCardSent } from './OfferCardSent'
import { OfferCardReceived } from './OfferCardReceived'
import { OfferAcceptedCardOut } from './OfferAcceptedCardOut'
import { OfferAcceptedCardIn } from './OfferAcceptedCardIn'
import { OfferRejectedBubble } from './OfferRejectedBubble'
import { OfferExpiredBubble } from './OfferExpiredBubble'

const EVENT_TYPE_MAP: Record<string, OfferEventType> = {
  offer_sent: 'OfferSent',
  offer_accepted: 'OfferAccepted',
  offer_rejected: 'OfferRejected',
  offer_expired: 'OfferExpired',
}

export interface OfferTimelineMessage {
  id: string
  author_account_id: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
}

interface OfferTimelineEntryProps {
  message: OfferTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
}

export function OfferTimelineEntry({
  message,
  currentAccountId,
  counterpartDisplayName,
}: OfferTimelineEntryProps) {
  const offerEvent = EVENT_TYPE_MAP[message.event_type ?? '']
  if (!offerEvent) return null

  const viewerSide: ViewerSide =
    message.author_account_id === currentAccountId ? 'actor' : 'recipient'

  const rawPayload = message.payload ?? {}
  const snapshot =
    (rawPayload['snapshot'] as Record<string, unknown> | undefined) ??
    rawPayload

  switch (offerEvent) {
    case 'OfferSent': {
      const parsed = offerSnapshotSchema.safeParse(snapshot)
      if (!parsed.success) return null
      const snap: OfferSnapshot = parsed.data
      if (viewerSide === 'actor') {
        return <OfferCardSent snapshot={snap} status="sent" />
      }
      return <OfferCardReceived snapshot={snap} status="sent" />
    }

    case 'OfferAccepted': {
      const parsed = offerAcceptedSnapSchema.safeParse(snapshot)
      if (!parsed.success) return null
      const snap: OfferAcceptedSnap = parsed.data
      if (viewerSide === 'actor') {
        return <OfferAcceptedCardIn snapshot={snap} />
      }
      return (
        <OfferAcceptedCardOut
          snapshot={snap}
          creatorName={counterpartDisplayName}
        />
      )
    }

    case 'OfferRejected':
      return <OfferRejectedBubble viewerSide={viewerSide} />

    case 'OfferExpired':
      return <OfferExpiredBubble viewerSide={viewerSide} />
  }
}
