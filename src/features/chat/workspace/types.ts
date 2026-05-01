export interface ConversationCounterpart {
  kind: 'brand_workspace' | 'creator_profile'
  id: string
  display_name: string
  avatar_url: string | null
  handle: string | null
}

export interface ConversationLastMessagePreview {
  kind: 'text' | 'system_event' | 'attachment' | 'empty'
  text: string
  author_is_self: boolean
}

export interface ConversationListItem {
  id: string
  counterpart: ConversationCounterpart
  last_activity_at: string
  last_message_preview: ConversationLastMessagePreview
  unread_count: number
  needs_reply: boolean
  created_at: string
}

export interface ConversationListResponse {
  data: ConversationListItem[]
  next_cursor: string | null
  total_visible: number
}

export interface ConversationListParams {
  filter?: 'all' | 'unread' | 'needs_reply'
  search?: string
  campaign_id?: string
  cursor?: string
  limit?: number
}
