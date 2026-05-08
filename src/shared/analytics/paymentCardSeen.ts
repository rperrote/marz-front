import { customFetch } from '#/shared/api/mutator'

export interface PaymentCardSeenPayload {
  declared_payment_id: string
}

interface PaymentCardSeenAnalyticsEventRequest {
  event_name: 'payment_card_seen'
  payload: PaymentCardSeenPayload
}

export function trackCardSeen(payload: PaymentCardSeenPayload) {
  void customFetch<{ status: number; data: unknown }>('/v1/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      event_name: 'payment_card_seen',
      payload,
    } satisfies PaymentCardSeenAnalyticsEventRequest),
  }).catch(() => {
    // Analytics is non-blocking for the payment flow.
  })
}
