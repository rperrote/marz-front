import type { DomainEventEnvelope, EventHandler } from '#/shared/ws/events'
import type {
  DomainWsEvent,
  MessageCreatedPayload,
  MessageReadBatchPayload,
  TypingStartedPayload,
  TypingStoppedPayload,
  PresenceUpdatedPayload,
} from '#/shared/ws/types'
import type { ChatWsHandlers } from './types'

function makeConversationGuard<T extends { conversation_id: string }>(
  conversationId: string,
  callback: ((envelope: DomainEventEnvelope<T>) => void) | undefined,
): EventHandler {
  return (envelope) => {
    if (!callback) return
    if (
      typeof (envelope.payload as Record<string, unknown>)[
        'conversation_id'
      ] !== 'string'
    )
      return
    const typed = envelope as DomainEventEnvelope<T>
    if (typed.payload.conversation_id !== conversationId) return
    callback(typed)
  }
}

type ChatEventTypes = Extract<
  DomainWsEvent,
  { event_type: string }
>['event_type']

export function buildChatHandlers(
  conversationId: string,
  handlers: ChatWsHandlers,
): Partial<Record<ChatEventTypes, EventHandler>> {
  return {
    'message.created': makeConversationGuard<MessageCreatedPayload>(
      conversationId,
      handlers.onMessageCreated,
    ),
    'message.read.batch': makeConversationGuard<MessageReadBatchPayload>(
      conversationId,
      handlers.onMessageReadBatch,
    ),
    'typing.started': makeConversationGuard<TypingStartedPayload>(
      conversationId,
      handlers.onTypingStarted,
    ),
    'typing.stopped': makeConversationGuard<TypingStoppedPayload>(
      conversationId,
      handlers.onTypingStopped,
    ),
    'presence.updated': makeConversationGuard<PresenceUpdatedPayload>(
      conversationId,
      handlers.onPresenceUpdated,
    ),
  }
}
