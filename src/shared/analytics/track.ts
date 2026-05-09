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
  | 'brand_payment_opened'
  | 'campaign_board_viewed'
  | 'campaign_board_searched'
  | 'campaign_board_filtered'
  | 'campaign_board_sorted'
  | 'campaign_board_brief_opened'
  | 'campaign_board_application_started'
  | 'campaign_board_application_submitted'
  | 'campaign_board_empty_state_seen'
  | 'earnings_viewed'
  | 'earnings_period_changed'
  | 'earnings_payment_search_used'
  | 'earnings_csv_exported'
  | 'earnings_bonus_opened'
  | 'earnings_payment_opened'
  | 'inbox_viewed'
  | 'inbox_filter_changed'
  | 'inbox_refreshed'
  | 'inbox_item_opened'
  | 'inbox_inline_started'
  | 'inbox_inline_completed'
  | 'inbox_inline_failed'
  | 'inbox_item_marked_read'
  | 'inbox_marked_read_bulk'
  | 'inbox_empty_viewed'
  | 'campaign_detail_viewed'
  | 'campaign_detail_tab_changed'
  | 'discovery_section_viewed'
  | 'discovery_match_contacted'
  | 'discovery_application_decided'
  | 'discovery_invite_created'

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
