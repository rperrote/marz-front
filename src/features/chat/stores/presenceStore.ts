import { create } from 'zustand'

type PresenceState = 'online' | 'offline' | 'disconnected'

interface PresenceEntry {
  state: PresenceState
  updatedAt: number
}

interface PresenceStoreState {
  entries: Record<string, PresenceEntry>
  setPresence: (accountId: string, state: PresenceState) => void
  clear: () => void
}

export const usePresenceStore = create<PresenceStoreState>()((set) => ({
  entries: {},
  setPresence: (accountId, state) =>
    set((prev) => ({
      entries: {
        ...prev.entries,
        [accountId]: { state, updatedAt: Date.now() },
      },
    })),
  clear: () => set({ entries: {} }),
}))

export function usePresence(accountId: string): PresenceState {
  return usePresenceStore((s) => s.entries[accountId]?.state ?? 'offline')
}
