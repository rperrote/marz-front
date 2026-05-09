import type { WSMessageCreatedPayload } from '#/shared/api/generated/model'
import type {
  DeliverableDTO,
  PublishedLink,
} from '#/features/deliverables/types'
import type {
  CampaignConfigurationActivatedPayload,
  CampaignConfigurationUpdatedPayload,
  DomainEventEnvelope,
} from './events'

// Discriminated union over `type` ('text' | 'system_event'); system events
// carry `event_type` plus a self-contained snapshot in `payload`.
export type MessageCreatedPayload = WSMessageCreatedPayload

export interface MessageReadBatchPayload {
  conversation_id: string
  message_ids: string[]
  read_at: string
}

export interface TypingStartedPayload {
  conversation_id: string
  actor_account_id: string
  actor_kind: 'brand' | 'creator'
}

export interface TypingStoppedPayload {
  conversation_id: string
  actor_account_id: string
}

export interface PresenceUpdatedPayload {
  conversation_id: string
  counterpart_kind: 'brand_workspace' | 'creator_profile'
  counterpart_id: string
  state: 'online' | 'offline' | 'disconnected'
}

export interface ConversationActivityUpdatedPayload {
  conversation_id: string
  last_activity_at: string
  last_message_id: string
  last_message_preview: {
    type: 'text'
    text_content: string
    author_account_id: string
    sent_at: string
  }
  unread_count_delta: number
}

export interface DraftSubmittedSnapshot {
  event_type: 'DraftSubmitted'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  draft_id: string
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
}

export interface DraftApprovedSnapshot {
  event_type: 'DraftApproved'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  draft_id: string
  version: number
  approved_at: string
  approved_by_account_id: string
}

export interface ChangesRequestedSnapshot {
  event_type: 'ChangesRequested'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  draft_id: string
  draft_version: number
  draft_thumbnail_url: string | null
  categories: string[]
  notes: string | null
  requested_at: string
  requested_by_account_id: string
}

export interface PaymentMarkedSnapshot {
  event_type: 'PaymentMarked'
  deliverable_id: string
  amount: string
  currency: string
  deliverable_display_label: string
  declared_at: string
}

export interface LinkSubmittedSnapshot {
  event_type: 'LinkSubmitted'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  link: {
    id: string
    url: string
    status: 'submitted' | 'changes_requested' | 'approved' | 'rejected'
    preview: unknown | null
    submitted_at: string
    submitted_by_account_id: string
  }
  message?: string | null
  payout_amount_formatted?: string | null
}

export interface LinkApprovedSnapshot {
  event_type: 'LinkApproved'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  link: {
    id: string
    url: string
    status: 'approved'
    preview: unknown | null
  }
  approved_at: string
  approved_by_account_id: string
}

export interface LinkChangesRequestedSnapshot {
  event_type: 'LinkChangesRequested'
  deliverable_id: string
  deliverable_platform: string
  deliverable_format: string
  deliverable_offer_stage_id: string | null
  link: {
    id: string
    url: string
    status: 'changes_requested'
    preview: unknown | null
  }
  categories: string[]
  notes: string | null
  requested_at: string
  requested_by_account_id: string
}

export interface DraftSubmittedWSPayload {
  conversation_id: string
  deliverable_id: string
  draft_id: string
  version: number
  message_id: string
  snapshot: DraftSubmittedSnapshot
}

export interface DraftApprovedWSPayload {
  conversation_id: string
  deliverable_id: string
  draft_id: string
  version: number
  message_id: string
  snapshot: DraftApprovedSnapshot
}

export interface ChangesRequestedWSPayload {
  conversation_id: string
  deliverable_id: string
  draft_id: string
  version: number
  message_id: string
  snapshot: ChangesRequestedSnapshot
}

export interface DeliverableChangedWSPayload {
  conversation_id: string
  deliverable: DeliverableDTO
  current_link?: PublishedLink | null
}

export interface StageApprovedWSPayload {
  conversation_id: string
  offer_id: string
  stage_id: string
  position: number
  total_stages: number
  approved_at: string
}

export interface StageOpenedWSPayload {
  conversation_id: string
  offer_id: string
  stage_id: string
  position: number
  total_stages: number
  name: string
  prev_stage_position: number | null
}

export type DomainWsEvent =
  | (DomainEventEnvelope<MessageCreatedPayload> & {
      event_type: 'message.created'
    })
  | (DomainEventEnvelope<MessageReadBatchPayload> & {
      event_type: 'message.read.batch'
    })
  | (DomainEventEnvelope<TypingStartedPayload> & {
      event_type: 'typing.started'
    })
  | (DomainEventEnvelope<TypingStoppedPayload> & {
      event_type: 'typing.stopped'
    })
  | (DomainEventEnvelope<PresenceUpdatedPayload> & {
      event_type: 'presence.updated'
    })
  | (DomainEventEnvelope<ConversationActivityUpdatedPayload> & {
      event_type: 'conversation.activity_updated'
    })
  | (DomainEventEnvelope<DraftSubmittedWSPayload> & {
      event_type: 'draft.submitted'
    })
  | (DomainEventEnvelope<DraftApprovedWSPayload> & {
      event_type: 'draft.approved'
    })
  | (DomainEventEnvelope<ChangesRequestedWSPayload> & {
      event_type: 'changes.requested'
    })
  | (DomainEventEnvelope<DeliverableChangedWSPayload> & {
      event_type: 'deliverable.changed'
    })
  | (DomainEventEnvelope<DeliverableChangedWSPayload> & {
      event_type: 'deliverable.updated'
    })
  | (DomainEventEnvelope<StageApprovedWSPayload> & {
      event_type: 'stage.approved'
    })
  | (DomainEventEnvelope<StageOpenedWSPayload> & {
      event_type: 'stage.opened'
    })
  | (DomainEventEnvelope<CampaignConfigurationUpdatedPayload> & {
      event_type: 'campaign.configuration.updated'
    })
  | (DomainEventEnvelope<CampaignConfigurationActivatedPayload> & {
      event_type: 'campaign.configuration.activated'
    })
