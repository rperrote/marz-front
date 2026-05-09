import { useCallback } from 'react'

import { customFetch } from '#/shared/api/mutator'

export type MarkAsPaidStep = 'amount' | 'final_confirmation'

type PaymentAnalyticsEvent =
  | 'payment_mark_opened'
  | 'payment_mark_amount_overridden'
  | 'payment_mark_cancelled'

interface PaymentAnalyticsPayload {
  deliverable_id: string
  step?: MarkAsPaidStep
}

interface PaymentFlowAnalyticsEventRequest {
  event_name: PaymentAnalyticsEvent
  payload: PaymentAnalyticsPayload
}

export function usePaymentAnalytics(deliverableId: string | null) {
  const trackPaymentEvent = useCallback(
    (eventName: PaymentAnalyticsEvent, payload?: { step?: MarkAsPaidStep }) => {
      if (!deliverableId) return

      void customFetch<{ status: number; data: unknown }>(
        '/v1/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify({
            event_name: eventName,
            payload: {
              deliverable_id: deliverableId,
              ...(payload?.step ? { step: payload.step } : {}),
            },
          } satisfies PaymentFlowAnalyticsEventRequest),
        },
      ).catch(() => {
        // Analytics is non-blocking for the payment flow.
      })
    },
    [deliverableId],
  )

  return {
    trackOpened: () => trackPaymentEvent('payment_mark_opened'),
    trackAmountOverridden: () =>
      trackPaymentEvent('payment_mark_amount_overridden'),
    trackCancelled: (step: MarkAsPaidStep) =>
      trackPaymentEvent('payment_mark_cancelled', { step }),
  }
}
