import { useMe } from '#/shared/api/generated/accounts/accounts'
import { useOfferActions } from '#/features/offers/hooks/useOfferActions'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'

import type {
  OfferSnapshot,
  OfferAcceptedSnap,
  OfferSnapshotBundle,
  OfferSnapshotMultiStage,
  OfferEventType,
  OfferStatus,
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
  OfferSent: 'OfferSent',
  OfferAccepted: 'OfferAccepted',
  OfferRejected: 'OfferRejected',
  OfferExpired: 'OfferExpired',
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
  conversationId?: string
  counterpartDisplayName: string
  onUploadDraft?: (deliverableId: string) => void
}

export function OfferTimelineEntry({
  message,
  currentAccountId,
  conversationId = '',
  counterpartDisplayName,
  onUploadDraft,
}: OfferTimelineEntryProps) {
  const meQuery = useMe()
  const actorKind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined
  const { accept, reject, isActing } = useOfferActions({ conversationId })
  const offersListing = useConversationOffersPaginated(conversationId)
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)

  const offerEvent = EVENT_TYPE_MAP[message.event_type ?? '']
  if (!offerEvent) return null

  // El snapshot del mensaje es inmutable; para reflejar el estado actual
  // (ej: oferta aceptada despues), buscamos el offer real en current + archive.
  const offerIdFromSnapshot = (() => {
    const payload = message.payload
    if (!payload) return null
    const snapshot = payload['snapshot'] as Record<string, unknown> | undefined
    if (snapshot && typeof snapshot['offer_id'] === 'string') {
      return snapshot['offer_id']
    }
    if (typeof payload['offer_id'] === 'string') {
      return payload['offer_id']
    }
    return null
  })()

  const liveOffer = offerIdFromSnapshot
    ? offersListing.current?.id === offerIdFromSnapshot
      ? offersListing.current
      : (offersListing.archiveItems.find(
          (item) => item.offer.id === offerIdFromSnapshot,
        )?.offer ?? null)
    : null
  const liveStatus = liveOffer?.status
  const firstDeliverableId = deliverablesQuery.data?.deliverables[0]?.id ?? null

  // OfferSent lo emite el brand y OfferAccepted lo emite el creator. El
  // author_account_id puede apuntar a un actor de sistema, asi que derivamos
  // viewerSide del kind del viewer para esos eventos.
  const viewerSide: ViewerSide =
    offerEvent === 'OfferSent'
      ? actorKind === 'brand'
        ? 'actor'
        : 'recipient'
      : offerEvent === 'OfferAccepted'
        ? actorKind === 'creator'
          ? 'actor'
          : 'recipient'
        : message.author_account_id === currentAccountId
          ? 'actor'
          : 'recipient'

  const rawPayload = message.payload ?? {}
  const snapshot =
    (rawPayload['snapshot'] as Record<string, unknown> | undefined) ??
    rawPayload
  const side = viewerSide === 'actor' ? 'out' : 'in'

  switch (offerEvent) {
    case 'OfferSent': {
      // status real (current/archive) o fallback al snapshot
      const effectiveStatus: OfferStatus = liveStatus ?? 'sent'

      const bundleParsed = offerSnapshotBundleSchema.safeParse(snapshot)
      if (bundleParsed.success) {
        const snap: OfferSnapshotBundle = bundleParsed.data
        return (
          <OfferCardBundle
            snapshot={snap}
            status={effectiveStatus}
            side={side}
          />
        )
      }

      const multiStageParsed = offerSnapshotMultiStageSchema.safeParse(snapshot)
      if (multiStageParsed.success) {
        const snap: OfferSnapshotMultiStage = multiStageParsed.data
        return (
          <OfferCardMultiStage
            snapshot={snap}
            status={effectiveStatus}
            side={side}
          />
        )
      }

      const parsed = offerSnapshotSchema.safeParse(snapshot)
      if (!parsed.success) return null
      const snap: OfferSnapshot = parsed.data
      if (viewerSide === 'actor') {
        return <OfferCardSent snapshot={snap} status={effectiveStatus} />
      }
      return (
        <OfferCardReceived
          snapshot={snap}
          status={effectiveStatus}
          onAccept={() =>
            accept.mutate({
              offerId: snap.offer_id,
              sentAt: snap.sent_at,
              offerType: snap.type,
            })
          }
          onReject={() =>
            reject.mutate({
              offerId: snap.offer_id,
              sentAt: snap.sent_at,
              offerType: snap.type,
            })
          }
          isAccepting={accept.isPending}
          isRejecting={reject.isPending || isActing}
        />
      )
    }

    case 'OfferAccepted': {
      const bundleParsed = offerAcceptedBundleSnapSchema.safeParse(snapshot)
      if (bundleParsed.success) {
        const snap = bundleParsed.data
        if (viewerSide === 'actor') {
          return (
            <OfferAcceptedCardIn
              snapshot={snap}
              side={side}
              onUploadDraft={
                firstDeliverableId && onUploadDraft
                  ? () => onUploadDraft(firstDeliverableId)
                  : undefined
              }
            />
          )
        }
        return (
          <OfferAcceptedCardOut
            snapshot={snap}
            creatorName={counterpartDisplayName}
            side={side}
          />
        )
      }

      const multiStageParsed =
        offerAcceptedMultiStageSnapSchema.safeParse(snapshot)
      if (multiStageParsed.success) {
        const snap = multiStageParsed.data
        if (viewerSide === 'actor') {
          return (
            <OfferAcceptedCardIn
              snapshot={snap}
              side={side}
              onUploadDraft={
                firstDeliverableId && onUploadDraft
                  ? () => onUploadDraft(firstDeliverableId)
                  : undefined
              }
            />
          )
        }
        return (
          <OfferAcceptedCardOut
            snapshot={snap}
            creatorName={counterpartDisplayName}
            side={side}
          />
        )
      }

      const parsed = offerAcceptedSnapSchema.safeParse(snapshot)
      if (!parsed.success) return null
      const snap: OfferAcceptedSnap = parsed.data
      if (viewerSide === 'actor') {
        return (
          <OfferAcceptedCardIn
            snapshot={snap}
            side={side}
            onUploadDraft={
              firstDeliverableId && onUploadDraft
                ? () => onUploadDraft(firstDeliverableId)
                : undefined
            }
          />
        )
      }
      return (
        <OfferAcceptedCardOut
          snapshot={snap}
          creatorName={counterpartDisplayName}
          side={side}
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
