import { customFetch } from '#/shared/api/mutator'

export function postAnalyticsEvent(
  eventName: string,
  properties: object,
): void {
  // Analytics is fire-and-forget; endpoint failures must not block the UI.
  void customFetch('/v1/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      event_name: eventName,
      properties,
      occurred_at: new Date().toISOString(),
    }),
  }).catch(() => {})
}
