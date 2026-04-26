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

const ANALYTICS_PATH = '/api/v1/analytics/events'

function getAnalyticsFullUrl(): string {
  return `${env.VITE_API_URL.replace(/\/$/, '')}${ANALYTICS_PATH}`
}

export function trackBriefBuilderStarted(
  payload: BriefBuilderStartedPayload,
): void {
  const event = buildEvent('brief_builder_started', { ...payload })
  void customFetch(ANALYTICS_PATH, {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function trackBriefBuilderAbandoned(
  payload: BriefBuilderAbandonedPayload,
): void {
  const event = buildEvent('brief_builder_abandoned', { ...payload })
  void customFetch(ANALYTICS_PATH, {
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
  navigator.sendBeacon(getAnalyticsFullUrl(), blob)
}
