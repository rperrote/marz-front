import { describe, it, expect } from 'vitest'

import { formatRelativeTime } from './formatRelativeTime'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatRelativeTime', () => {
  const now = new Date('2026-04-26T12:00:00Z').getTime()

  it('returns minutes for < 1h', () => {
    const date = new Date(now - 15 * MINUTE).toISOString()
    expect(formatRelativeTime(date, now)).toBe('15m')
  })

  it('returns at least 1m for very recent', () => {
    const date = new Date(now - 10_000).toISOString()
    expect(formatRelativeTime(date, now)).toBe('1m')
  })

  it('returns hours for < 24h', () => {
    const date = new Date(now - 3 * HOUR).toISOString()
    expect(formatRelativeTime(date, now)).toBe('3h')
  })

  it('returns days for < 7d', () => {
    const date = new Date(now - 2 * DAY).toISOString()
    expect(formatRelativeTime(date, now)).toBe('2d')
  })

  it('returns month + day for >= 7d', () => {
    const date = new Date('2026-04-12T10:00:00Z').toISOString()
    expect(formatRelativeTime(date, now)).toBe('abr 12')
  })

  it('returns month + day for dates in a different month', () => {
    const date = new Date('2026-01-05T10:00:00Z').toISOString()
    expect(formatRelativeTime(date, now)).toBe('ene 5')
  })
})
