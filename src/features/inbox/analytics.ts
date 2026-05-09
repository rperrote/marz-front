import { track } from '#/shared/analytics/track'

import type { InboxInlineAction, InboxItem, InboxResponse } from './api/inbox'

type InboxAccountKind = InboxResponse['account_kind']
type InboxSection = InboxItem['section']
type InboxItemKind = InboxItem['kind']
type InboxCampaignId = string | null

interface InboxBasePayload {
  account_kind: InboxAccountKind
  campaign_id: InboxCampaignId
}

export interface InboxItemAnalyticsPayload extends InboxBasePayload {
  item_kind: InboxItemKind
  section: InboxSection
}

interface InboxInlineAnalyticsPayload extends InboxItemAnalyticsPayload {
  action_type: InboxInlineAction['type']
}

export function createInboxItemAnalyticsPayload({
  accountKind,
  item,
}: {
  accountKind: InboxAccountKind
  item: InboxItem
}): InboxItemAnalyticsPayload {
  return {
    account_kind: accountKind,
    campaign_id: item.campaign?.id ?? null,
    item_kind: item.kind,
    section: item.section,
  }
}

export function trackInboxViewed(
  payload: InboxBasePayload & {
    action_count: number
    waiting_count: number
  },
): void {
  track('inbox_viewed', { ...payload })
}

export function trackInboxFilterChanged(
  payload: InboxBasePayload & {
    has_campaign_filter: boolean
  },
): void {
  track('inbox_filter_changed', { ...payload })
}

export function trackInboxRefreshed(payload: InboxBasePayload): void {
  track('inbox_refreshed', { ...payload })
}

export function trackInboxItemOpened(
  payload: InboxItemAnalyticsPayload & {
    navigation_type: NonNullable<InboxItem['navigation_action']>['type']
  },
): void {
  track('inbox_item_opened', { ...payload })
}

export function trackInboxInlineStarted(
  payload: InboxInlineAnalyticsPayload,
): void {
  track('inbox_inline_started', { ...payload })
}

export function trackInboxInlineCompleted(
  payload: InboxInlineAnalyticsPayload,
): void {
  track('inbox_inline_completed', { ...payload })
}

export function trackInboxInlineFailed(
  payload: InboxInlineAnalyticsPayload & {
    error_code?: string
    error_status?: number
  },
): void {
  track('inbox_inline_failed', { ...payload })
}

export function trackInboxItemMarkedRead(
  payload: InboxItemAnalyticsPayload,
): void {
  track('inbox_item_marked_read', { ...payload })
}

export function trackInboxMarkedReadBulk(payload: InboxBasePayload): void {
  track('inbox_marked_read_bulk', { ...payload })
}

export function trackInboxEmptyViewed(payload: InboxBasePayload): void {
  track('inbox_empty_viewed', { ...payload })
}
