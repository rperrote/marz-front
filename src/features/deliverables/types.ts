import type {
  ConversationDeliverablesResponse as GeneratedConversationDeliverablesResponse,
  DeliverableDTO as GeneratedDeliverableDTO,
  DraftDTO as GeneratedDraftDTO,
} from '#/shared/api/generated/model'

export type DeliverableStatus =
  | 'pending'
  | 'draft_submitted'
  | 'changes_requested'
  | 'draft_approved'
  | 'link_submitted'
  | 'link_approved'
  | 'completed'
  | 'paid'

export type DraftDTO = GeneratedDraftDTO

export interface ChangeRequestDTO {
  id: string
  draft_id: string
  categories: string[]
  notes: string | null
  requested_at: string
  requested_by_account_id: string
}

export type DeliverableDTO = GeneratedDeliverableDTO & {
  change_requests_count?: number
  latest_change_request?: ChangeRequestDTO | null
  change_requests?: ChangeRequestDTO[]
}

export type ConversationDeliverablesResponse = Omit<
  GeneratedConversationDeliverablesResponse,
  'deliverables'
> & {
  deliverables: DeliverableDTO[]
}

export interface DraftTimelineMessage {
  id: string
  author_account_id: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

// El backend ahora expone PublishedLinkDTO y PublishedLinkPreviewDTO en el
// spec, pero el shape del preview cambió (objeto con campos nullable en vez
// de discriminated union). Mantenemos los tipos locales como vista de UI y
// hacemos el mapping en los hooks que consumen Orval.
export type PublishedLinkStatus =
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'rejected'

export type PublishedLinkPreview =
  | {
      outcome: 'title_and_thumbnail'
      title: string
      thumbnail_url: string
    }
  | {
      outcome: 'url_only'
    }
  | {
      outcome: 'failed'
    }

export interface PublishedLink {
  id: string
  deliverable_id: string
  url: string
  status: PublishedLinkStatus
  preview: PublishedLinkPreview
  submitted_at: string
  submitted_by_account_id: string
  approved_at?: string | null
  approved_by_account_id?: string | null
}

export interface DeliverableLinksResponse {
  links: PublishedLink[]
  current_link_id: string | null
}
