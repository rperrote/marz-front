import { describe, expect, it } from 'vitest'

import {
  generateClientMessageId,
  isValidClientMessageId,
} from './clientMessageId'

describe('generateClientMessageId', () => {
  it('produces a valid UUID v7 string', () => {
    const id = generateClientMessageId()
    expect(isValidClientMessageId(id)).toBe(true)
  })

  it('generates unique ids', () => {
    const ids = new Set(
      Array.from({ length: 100 }, () => generateClientMessageId()),
    )
    expect(ids.size).toBe(100)
  })

  it('embeds a monotonic timestamp', () => {
    const before = Date.now()
    const id = generateClientMessageId()
    const after = Date.now()

    const hex = id.replace(/-/g, '').slice(0, 12)
    const ts = parseInt(hex, 16)

    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

describe('isValidClientMessageId', () => {
  it('accepts valid v7', () => {
    expect(isValidClientMessageId('019668a8-2bcd-7000-8000-000000000001')).toBe(
      true,
    )
  })

  it('rejects v4', () => {
    expect(isValidClientMessageId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      false,
    )
  })

  it('rejects garbage', () => {
    expect(isValidClientMessageId('not-a-uuid')).toBe(false)
  })
})
