export type OfferStatus = 'sent' | 'accepted' | 'rejected' | 'expired'

export interface OfferSpeedBonus {
  early_deadline: string
  bonus_amount: string
  currency: string
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
  speed_bonus: OfferSpeedBonus | null
  sent_at: string
  expires_at: string
}

export interface OfferAcceptedSnap extends OfferSnapshot {
  accepted_at: string
}

export interface OfferRejectedSnap extends OfferSnapshot {
  rejected_at: string
  reason: string | null
}

export interface OfferExpiredSnap extends OfferSnapshot {
  expired_at: string
}

export type OfferLifecycleSnap =
  | OfferSnapshot
  | OfferAcceptedSnap
  | OfferRejectedSnap
  | OfferExpiredSnap

export type OfferEventType =
  | 'OfferSent'
  | 'OfferAccepted'
  | 'OfferRejected'
  | 'OfferExpired'

export type ViewerSide = 'actor' | 'recipient'

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
  speed_bonus: OfferSpeedBonus | null
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
