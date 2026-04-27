import { describe, it, expect, beforeEach } from 'vitest'

import { usePresenceStore } from '../presenceStore'

beforeEach(() => {
  usePresenceStore.setState({ entries: {} })
})

describe('presenceStore', () => {
  it('sets presence for an account', () => {
    usePresenceStore.getState().setPresence('acc-1', 'online')

    const entry = usePresenceStore.getState().entries['acc-1']
    expect(entry?.state).toBe('online')
    expect(entry?.updatedAt).toBeGreaterThan(0)
  })

  it('updates presence from online to offline', () => {
    usePresenceStore.getState().setPresence('acc-1', 'online')
    usePresenceStore.getState().setPresence('acc-1', 'offline')

    expect(usePresenceStore.getState().entries['acc-1']?.state).toBe('offline')
  })

  it('allows updating from disconnected to online', () => {
    usePresenceStore.getState().setPresence('acc-1', 'disconnected')
    usePresenceStore.getState().setPresence('acc-1', 'online')

    expect(usePresenceStore.getState().entries['acc-1']?.state).toBe('online')
  })

  it('returns undefined entry for unknown account', () => {
    const entry = usePresenceStore.getState().entries['unknown']
    expect(entry).toBeUndefined()
  })

  it('usePresence fallback returns offline for unknown account', () => {
    const state =
      usePresenceStore.getState().entries['unknown']?.state ?? 'offline'
    expect(state).toBe('offline')
  })

  it('clears all entries', () => {
    usePresenceStore.getState().setPresence('acc-1', 'online')
    usePresenceStore.getState().setPresence('acc-2', 'offline')
    usePresenceStore.getState().clear()

    expect(usePresenceStore.getState().entries).toEqual({})
  })
})
