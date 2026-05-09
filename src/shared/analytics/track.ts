type AnalyticsEvent =
  | 'magic_link_requested'
  | 'magic_link_succeeded'
  | 'magic_link_failed'
  | 'kind_selected'
  | 'onboarding_step_entered'
  | 'onboarding_step_completed'
  | 'onboarding_abandoned'
  | 'onboarding_step_skipped'
  | 'onboarding_completed'
  | 'sign_in_succeeded'
  | 'sign_out'
  | 'onboarding_redirect_enforced'
  | 'workspace_opened'
  | 'conversation_rail_search'
  | 'conversation_filter_changed'
  | 'conversation_campaign_filter_changed'
  | 'brand_payments_viewed'
  | 'brand_payments_period_changed'
  | 'brand_payments_filter_changed'
  | 'brand_payments_search_used'
  | 'brand_payments_csv_exported'
  | 'brand_payments_refresh_clicked'

interface TrackedEvent {
  event: AnalyticsEvent
  payload: Record<string, unknown> | undefined
  timestamp: number
}

const buffer: TrackedEvent[] = []

export function track(
  event: AnalyticsEvent,
  payload?: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return

  const entry: TrackedEvent = { event, payload, timestamp: Date.now() }
  buffer.push(entry)
  console.debug('[analytics]', event, payload)
}

export function getTrackedEvents(): readonly TrackedEvent[] {
  return buffer
}

export function resetTrackedEvents(): void {
  buffer.length = 0
}

export type { AnalyticsEvent, TrackedEvent }
