import { create } from 'zustand'

interface ConversationRailState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useConversationRailStore = create<ConversationRailState>()(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  }),
)
