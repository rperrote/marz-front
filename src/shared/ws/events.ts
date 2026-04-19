/**
 * Domain event envelope pushed by marz-api over WebSocket.
 * Schema matches `shared.domain_events` table in the backend
 * (marz-docs/architecture/event-catalog.md).
 *
 * `payload` is autocontenido: system-event messages carry the full snapshot
 * needed to render cards without re-fetching the source aggregate.
 */
export interface DomainEventEnvelope<TPayload = unknown> {
  event_id: string
  event_type: string
  schema_version: string
  aggregate_id: string
  aggregate_type: string
  occurred_at: string
  actor_account_id?: string
  payload: TPayload
}

export type EventHandler<T = unknown> = (event: DomainEventEnvelope<T>) => void
