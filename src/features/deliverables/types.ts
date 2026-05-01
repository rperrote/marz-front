export type DeliverableStatus =
  | 'pending'
  | 'draft_submitted'
  | 'changes_requested'
  | 'draft_approved'
  | 'link_submitted'
  | 'link_approved'
  | 'completed'

export type OfferType = 'single' | 'bundle' | 'multistage'

export type StageStatus = 'locked' | 'open' | 'approved'

export interface DraftDTO {
  id: string
  version: number
  original_filename: string
  file_size_bytes: number
  duration_sec: number | null
  mime_type: string | null
  thumbnail_url: string | null
  playback_url: string
  playback_url_expires_at: string
  submitted_at: string
  submitted_by_account_id: string
  approved_at?: string | null
}

export interface ChangeRequestDTO {
  id: string
  draft_id: string
  categories: string[]
  notes: string | null
  requested_at: string
  requested_by_account_id: string
}

export interface DeliverableDTO {
  id: string
  offer_id: string
  offer_stage_id: string | null
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter_x'
  format: string
  status: DeliverableStatus
  deadline: string | null
  current_version: number | null
  current_draft: unknown | null
  drafts_count: number
  change_requests_count: number
  drafts: DraftDTO[]
  latest_change_request: ChangeRequestDTO | null
  change_requests: ChangeRequestDTO[]
  created_at: string
  updated_at: string
}

export interface StageDTO {
  id: string
  position: number
  name: string
  deadline: string | null
  status: StageStatus
  deliverable_ids: string[]
}

export interface ConversationDeliverablesResponse {
  offer_id: string | null
  offer_type: OfferType | null
  deliverables: DeliverableDTO[]
  stages: StageDTO[]
}

export interface DraftTimelineMessage {
  id: string
  author_account_id: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
  created_at: string
}
