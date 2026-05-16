/* eslint-disable lingui/no-unlocalized-strings -- Test fixtures model backend payload values, not user-facing UI copy. */
import type { MessageItem } from '#/features/chat/types'

export function makeOfferSystemMessage(
  eventType:
    | 'OfferSent'
    | 'OfferAccepted'
    | 'OfferRejected'
    | 'OfferExpired'
    | 'OfferCancelled',
  snapshotOverrides: Record<string, unknown> = {},
): MessageItem {
  return {
    id: `msg-${eventType}`,
    conversation_id: 'conv-1',
    author_account_id: 'system',
    type: 'system_event',
    text_content: null,
    event_type: eventType,
    payload: {
      snapshot: {
        id: 'offer-1',
        campaign_id: 'campaign-1',
        brand_workspace_id: 'brand-1',
        creator_account_id: 'creator-1',
        created_by_account_id: 'brand-account-1',
        conversation_id: 'conv-1',
        offer_mode: 'per_platform',
        status: 'sent',
        amount: '4575.00',
        currency: 'USD',
        bonus_terms: null,
        tentative_publish_date: '2026-06-15',
        offer_deadline: '2026-06-20',
        expires_at: '2026-05-20T12:00:00Z',
        description: 'Oferta para campaña de verano',
        platforms: ['Instagram', 'TikTok'],
        deliverables: [
          {
            position: 1,
            platform: 'Instagram',
            format: 'Reel',
            quantity: 1,
            amount: '2575.00',
          },
          {
            position: 2,
            platform: 'TikTok',
            format: 'Video',
            quantity: 1,
            amount: '2000.00',
          },
        ],
        created_at: '2026-05-10T12:00:00Z',
        updated_at: '2026-05-10T12:00:00Z',
        sent_at: '2026-05-10T12:00:00Z',
        ...snapshotOverrides,
      },
    },
    created_at: '2026-05-10T12:00:00Z',
    read_by_self: false,
  }
}

export function makePaymentMarkedMessage(
  snapshotOverrides: Record<string, unknown> = {},
): MessageItem {
  return {
    id: 'msg-payment-1',
    conversation_id: 'conv-1',
    author_account_id: 'system',
    type: 'system_event',
    text_content: null,
    event_type: 'PaymentMarked',
    payload: {
      snapshot: {
        event_type: 'PaymentMarked',
        declared_payment_id: 'pay-1',
        deliverable_id: 'del-1',
        campaign_id: 'campaign-1',
        brand_workspace_id: 'brand-1',
        creator_account_id: 'creator-1',
        deliverable_label: 'YouTube Video',
        amount: '4575.00',
        currency: 'USD',
        actor_account_id: 'brand-account-1',
        declared_at: '2026-05-08T12:00:00Z',
        platforms: ['YouTube', 'Instagram'],
        deliverables_count: 2,
        ...snapshotOverrides,
      },
    },
    created_at: '2026-05-08T12:00:00Z',
    read_by_self: false,
  }
}
