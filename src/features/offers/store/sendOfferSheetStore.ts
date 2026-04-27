import { create } from 'zustand'

interface SendOfferSheetState {
  isOpen: boolean
  conversationId: string | null
  open: (conversationId: string) => void
  close: () => void
}

export const useSendOfferSheetStore = create<SendOfferSheetState>()((set) => ({
  isOpen: false,
  conversationId: null,
  open: (conversationId) => set({ isOpen: true, conversationId }),
  close: () => set({ isOpen: false, conversationId: null }),
}))
