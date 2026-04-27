import type { DomainEventEnvelope } from './events'

interface MessageCreatedTextPayload {
  id: string
  client_message_id: string | null
  conversation_id: string
  author_account_id: string
  type: 'text'
  text_content: string
  event_type?: never
  payload?: never
  created_at: string
}

interface MessageCreatedSystemEventPayload {
  id: string
  client_message_id: null
  conversation_id: string
  author_account_id: string
  type: 'system_event'
  text_content: null
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export type MessageCreatedPayload =
  | MessageCreatedTextPayload
  | MessageCreatedSystemEventPayload

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
