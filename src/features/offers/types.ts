import type {
  ArchivedOfferItem,
  OfferBonusTerms,
  OfferDTO,
} from '#/shared/api/generated/model'

export type OfferStatus = 'sent' | 'accepted' | 'rejected' | 'expired'

export type OfferMode = 'same_content' | 'per_platform'

export type OfferCancellationPhase = 'pre' | 'post'

export type OfferDetailStatus = OfferStatus | 'cancelled'

export type OfferDetailDTO = Omit<OfferDTO, 'status'> & {
  status: OfferDetailStatus
  offer_mode?: OfferMode | null
  tentative_publish_date?: string | null
  offer_deadline?: string | null
  platforms?: string[] | null
  currency?: string | null
  paid_at?: string | null
  cancelled_at?: string | null
  cancellation_phase?: OfferCancellationPhase | null
}

export type ArchivedOfferDetailItem = Omit<ArchivedOfferItem, 'offer'> & {
  offer: OfferDetailDTO
}

export interface OfferSnapshot {
  offer_id: string
  campaign_id: string
  campaign_name: string
  type: 'single'
  platform: string
  format: string
  total_amount: string
  currency: string
  deadline: string
  bonus_terms: OfferBonusTerms | null
  sent_at: string
  expires_at: string
}

export interface OfferAcceptedSnap extends OfferSnapshot {
  accepted_at: string
}

export type OfferEventType =
  | 'OfferSent'
  | 'OfferAccepted'
  | 'OfferRejected'
  | 'OfferExpired'

export type ViewerSide = 'actor' | 'recipient'

export interface StageOpenedSnap {
  position: number
  total: number
  name: string
  prev_stage_position: number | null
}

export interface BundleDeliverableSnapshot {
  platform: string
  format: string
  quantity: number
  amount: string
}

export interface OfferSnapshotBundle {
  offer_id: string
  campaign_id: string
  campaign_name: string
  type: 'bundle'
  total_amount: string
  currency: string
  deadline: string
  bonus_terms: OfferBonusTerms | null
  sent_at: string
  expires_at: string
  deliverables: BundleDeliverableSnapshot[]
}

export interface MultiStageItemSnapshot {
  name: string
  description: string
  deadline: string
  amount: string
}

export interface OfferSnapshotMultiStage {
  offer_id: string
  campaign_id: string
  campaign_name: string
  type: 'multistage'
  total_amount: string
  currency: string
  deadline: string
  sent_at: string
  expires_at: string
  stages: MultiStageItemSnapshot[]
}
