export function toMessagePayload(
  payload: unknown,
): Record<string, unknown> | null {
  if (isMessagePayload(payload)) return payload

  return null
}

export function isMessagePayload(
  payload: unknown,
): payload is Record<string, unknown> {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return false
  }

  return true
}
