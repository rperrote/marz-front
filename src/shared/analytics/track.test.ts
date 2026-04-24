import { describe, it, expect, beforeEach } from 'vitest'
import {
  track,
  getTrackedEvents,
  resetTrackedEvents,
} from '#/shared/analytics/track'

describe('track', () => {
  beforeEach(() => {
    resetTrackedEvents()
  })

  it('registers an event with payload', () => {
    track('kind_selected', { kind: 'brand' })

    const events = getTrackedEvents()
    expect(events).toHaveLength(1)
    expect(events[0]!.event).toBe('kind_selected')
    expect(events[0]!.payload).toEqual({ kind: 'brand' })
    expect(events[0]!.timestamp).toBeTypeOf('number')
  })

  it('registers an event without payload', () => {
    track('sign_out')

    const events = getTrackedEvents()
    expect(events).toHaveLength(1)
    expect(events[0]!.event).toBe('sign_out')
    expect(events[0]!.payload).toBeUndefined()
  })

  it('accumulates multiple events', () => {
    track('magic_link_requested', { email: 'test@example.com' })
    track('magic_link_succeeded')
    track('sign_in_succeeded')

    expect(getTrackedEvents()).toHaveLength(3)
  })

  it('resets tracked events', () => {
    track('kind_selected', { kind: 'creator' })
    resetTrackedEvents()

    expect(getTrackedEvents()).toHaveLength(0)
  })
})
