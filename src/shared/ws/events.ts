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

export interface CampaignConfigurationUpdatedPayload {
  event: 'campaign.configuration.updated'
  campaign_id: string
  brand_workspace_id: string
  changed_step: 'content_type' | 'pricing_model' | 'targeting' | 'bonus'
  current_step:
    | 'content_type'
    | 'pricing_model'
    | 'targeting'
    | 'bonus'
    | 'review'
  completed_steps: Array<
    'content_type' | 'pricing_model' | 'targeting' | 'bonus' | 'review'
  >
  configuration_version: number
  updated_at: string
}

export interface CampaignConfigurationActivatedPayload {
  event: 'campaign.configuration.activated'
  campaign_id: string
  brand_workspace_id: string
  status: 'active'
  configuration_version: number
  activated_at: string
  plan_allows_campaign_board: boolean
  plan_allows_automatic_matching: boolean
}

export type CampaignConfigurationUpdatedEvent =
  DomainEventEnvelope<CampaignConfigurationUpdatedPayload> & {
    event_type: 'campaigns.configuration.updated'
  }

export type CampaignConfigurationActivatedEvent =
  DomainEventEnvelope<CampaignConfigurationActivatedPayload> & {
    event_type: 'campaigns.configuration.activated'
  }
