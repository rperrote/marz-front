import { customFetch } from '#/shared/api/mutator'
import { env } from '#/env'

interface BriefBuilderStartedPayload {
  workspace_id: string
  processing_token: string
}

interface BriefBuilderAbandonedPayload {
  phase: number
  processing_token: string | null
}

interface AnalyticsEvent {
  event: string
  properties: Record<string, unknown>
  timestamp: string
}

function buildEvent(
  name: string,
  properties: Record<string, unknown>,
  timestamp?: string,
): AnalyticsEvent {
  return {
    event: name,
    properties,
    timestamp: timestamp ?? new Date().toISOString(),
  }
}

function getAnalyticsUrl(): string {
  return `${env.VITE_API_URL.replace(/\/$/, '')}/api/v1/analytics/events`
}

export function trackBriefBuilderStarted(
  payload: BriefBuilderStartedPayload,
): void {
  const event = buildEvent('brief_builder_started', { ...payload })
  void customFetch('/api/v1/analytics/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function trackBriefBuilderAbandoned(
  payload: BriefBuilderAbandonedPayload,
): void {
  const event = buildEvent('brief_builder_abandoned', { ...payload })
  void customFetch('/api/v1/analytics/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function trackBriefBuilderAbandonedBeacon(
  payload: BriefBuilderAbandonedPayload,
): void {
  const event = buildEvent('brief_builder_abandoned', { ...payload })
  const blob = new Blob([JSON.stringify(event)], {
    type: 'application/json',
  })
  navigator.sendBeacon(getAnalyticsUrl(), blob)
}
