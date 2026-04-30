import type { DomainEventEnvelope } from '#/shared/ws/events'
import type {
  MessageCreatedPayload,
  MessageReadBatchPayload,
  TypingStartedPayload,
  TypingStoppedPayload,
  PresenceUpdatedPayload,
} from '#/shared/ws/types'

export type ChatEventType =
  | 'message.created'
  | 'message.read.batch'
  | 'typing.started'
  | 'typing.stopped'
  | 'presence.updated'

export interface ChatWsHandlers {
  onMessageCreated?: (
    envelope: DomainEventEnvelope<MessageCreatedPayload>,
  ) => void
  onMessageReadBatch?: (
    envelope: DomainEventEnvelope<MessageReadBatchPayload>,
  ) => void
  onTypingStarted?: (
    envelope: DomainEventEnvelope<TypingStartedPayload>,
  ) => void
  onTypingStopped?: (
    envelope: DomainEventEnvelope<TypingStoppedPayload>,
  ) => void
  onPresenceUpdated?: (
    envelope: DomainEventEnvelope<PresenceUpdatedPayload>,
  ) => void
}
