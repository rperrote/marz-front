import { create } from 'zustand'

interface TypingStoreState {
  entries: Record<string, Set<string>>
  setTyping: (conversationId: string, accountId: string) => void
  clearTyping: (conversationId: string, accountId: string) => void
  clearAll: () => void
}

export const useTypingStore = create<TypingStoreState>()((set) => ({
  entries: {},
  setTyping: (conversationId, accountId) =>
    set((prev) => {
      const existing = prev.entries[conversationId]
      if (existing?.has(accountId)) return prev

      const next = new Set(existing)
      next.add(accountId)
      return { entries: { ...prev.entries, [conversationId]: next } }
    }),
  clearTyping: (conversationId, accountId) =>
    set((prev) => {
      const existing = prev.entries[conversationId]
      if (!existing?.has(accountId)) return prev

      const next = new Set(existing)
      next.delete(accountId)
      return { entries: { ...prev.entries, [conversationId]: next } }
    }),
  clearAll: () => set({ entries: {} }),
}))

export function useTypingActors(conversationId: string): ReadonlySet<string> {
  return useTypingStore((s) => s.entries[conversationId] ?? EMPTY_SET)
}

const EMPTY_SET: ReadonlySet<string> = new Set()
