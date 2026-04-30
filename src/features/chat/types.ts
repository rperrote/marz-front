export interface ConversationDetailCounterpart {
  kind: 'brand_workspace' | 'creator_profile'
  id: string
  display_name: string
  avatar_url: string | null
  handle: string | null
  is_active: boolean
}

export interface ConversationPresence {
  state: 'online' | 'offline' | 'disconnected'
  last_seen_at: string | null
}

export interface ConversationDetail {
  id: string
  counterpart: ConversationDetailCounterpart
  presence: ConversationPresence
  can_send: boolean
  created_at: string
}

export interface ConversationDetailResponse {
  data: ConversationDetail
}

export interface MessageItem {
  id: string
  conversation_id: string
  author_account_id: string | null
  type: 'text' | 'system_event'
  text_content: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
  created_at: string
  read_by_self: boolean
}

export interface MessagesResponse {
  data: MessageItem[]
  next_before_cursor: string | null
  has_more: boolean
}

export interface MessagesParams {
  conversationId: string
  beforeCursor?: string
  limit?: number
}
