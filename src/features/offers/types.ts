import type {
  ArchivedOfferItem,
  OfferDTO,
} from '#/shared/api/generated/model'

export type OfferMode = 'same_content' | 'per_platform'

export type OfferCancellationPhase = 'pre_accept' | 'post_accept'

export type OfferStatus = OfferDTO['status']

export type OfferDetailDTO = OfferDTO

export type ArchivedOfferDetailItem = ArchivedOfferItem

export type OfferEventType =
  | 'OfferSent'
  | 'OfferAccepted'
  | 'OfferRejected'
  | 'OfferExpired'
  | 'OfferCancelled'

export type ViewerSide = 'actor' | 'recipient'
