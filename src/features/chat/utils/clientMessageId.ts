// UUID v7 per RFC 9562: 48-bit unix_ts_ms + 4-bit version + 12-bit rand_a + 2-bit variant + 62-bit rand_b
export function generateClientMessageId(): string {
  const now = Date.now()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // timestamp (ms) in first 6 bytes, big-endian
  bytes[0] = (now / 2 ** 40) & 0xff
  bytes[1] = (now / 2 ** 32) & 0xff
  bytes[2] = (now / 2 ** 24) & 0xff
  bytes[3] = (now / 2 ** 16) & 0xff
  bytes[4] = (now / 2 ** 8) & 0xff
  bytes[5] = now & 0xff

  // version 7
  bytes[6] = (bytes[6]! & 0x0f) | 0x70
  // variant 10xx
  bytes[8] = (bytes[8]! & 0x3f) | 0x80

  return formatUuid(bytes)
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

const UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export function isValidClientMessageId(id: string): boolean {
  return UUID_V7_REGEX.test(id)
}
