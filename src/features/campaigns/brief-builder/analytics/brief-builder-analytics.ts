// Analytics soft-disabled: backend endpoint not yet defined in OpenAPI.
// Re-enable by routing through the Orval-generated client once the endpoint exists.

interface BriefBuilderStartedPayload {
  workspace_id: string
  processing_token: string
}

interface BriefBuilderAbandonedPayload {
  phase: number
  processing_token: string | null
}

export function trackBriefBuilderStarted(
  _payload: BriefBuilderStartedPayload,
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function trackBriefBuilderAbandoned(
  _payload: BriefBuilderAbandonedPayload,
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function trackBriefBuilderAbandonedBeacon(
  _payload: BriefBuilderAbandonedPayload,
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}
