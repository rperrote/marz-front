import { useMe } from '#/shared/api/generated/accounts/accounts'

import type {
  OfferSnapshot,
  OfferAcceptedSnap,
  OfferSnapshotBundle,
  OfferSnapshotMultiStage,
  OfferEventType,
  ViewerSide,
} from '../types'
import {
  offerSnapshotSchema,
  offerAcceptedSnapSchema,
  offerSnapshotBundleSchema,
  offerSnapshotMultiStageSchema,
  offerAcceptedBundleSnapSchema,
  offerAcceptedMultiStageSnapSchema,
} from '../schemas'

import { OfferCardSent } from './OfferCardSent'
import { OfferCardReceived } from './OfferCardReceived'
import { OfferCardBundle } from './OfferCardBundle'
import { OfferCardMultiStage } from './OfferCardMultiStage'
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
  const meQuery = useMe()
  const actorKind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined

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
      const bundleParsed = offerSnapshotBundleSchema.safeParse(snapshot)
      if (bundleParsed.success) {
        const snap: OfferSnapshotBundle = bundleParsed.data
        const side = viewerSide === 'actor' ? 'out' : 'in'
        return <OfferCardBundle snapshot={snap} status="sent" side={side} />
      }

      const multiStageParsed = offerSnapshotMultiStageSchema.safeParse(snapshot)
      if (multiStageParsed.success) {
        const snap: OfferSnapshotMultiStage = multiStageParsed.data
        const side = viewerSide === 'actor' ? 'out' : 'in'
        return <OfferCardMultiStage snapshot={snap} status="sent" side={side} />
      }

      const parsed = offerSnapshotSchema.safeParse(snapshot)
      if (!parsed.success) return null
      const snap: OfferSnapshot = parsed.data
      if (viewerSide === 'actor') {
        return <OfferCardSent snapshot={snap} status="sent" />
      }
      return <OfferCardReceived snapshot={snap} status="sent" />
    }

    case 'OfferAccepted': {
      const bundleParsed = offerAcceptedBundleSnapSchema.safeParse(snapshot)
      if (bundleParsed.success) {
        const snap = bundleParsed.data
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

      const multiStageParsed =
        offerAcceptedMultiStageSnapSchema.safeParse(snapshot)
      if (multiStageParsed.success) {
        const snap = multiStageParsed.data
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

    case 'OfferExpired': {
      if (!actorKind) return null

      const bundleParsed = offerSnapshotBundleSchema.safeParse(snapshot)
      if (bundleParsed.success) {
        const snap = bundleParsed.data
        return (
          <OfferExpiredBubble
            viewerSide={viewerSide}
            offerId={snap.offer_id}
            sentAt={snap.sent_at}
            actorKind={actorKind}
          />
        )
      }

      const multiStageParsed = offerSnapshotMultiStageSchema.safeParse(snapshot)
      if (multiStageParsed.success) {
        const snap = multiStageParsed.data
        return (
          <OfferExpiredBubble
            viewerSide={viewerSide}
            offerId={snap.offer_id}
            sentAt={snap.sent_at}
            actorKind={actorKind}
          />
        )
      }

      const parsed = offerSnapshotSchema.safeParse(snapshot)
      const snap = parsed.success ? parsed.data : null
      return (
        <OfferExpiredBubble
          viewerSide={viewerSide}
          offerId={snap?.offer_id}
          sentAt={snap?.sent_at}
          actorKind={actorKind}
        />
      )
    }
  }
}
