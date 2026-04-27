import { create } from 'zustand'

import { trackOfferEvent } from '../analytics'

interface SendOfferSheetState {
  isOpen: boolean
  conversationId: string | null
  open: (conversationId: string) => void
  close: () => void
}

export const useSendOfferSheetStore = create<SendOfferSheetState>()((set) => ({
  isOpen: false,
  conversationId: null,
  open: (conversationId) => {
    trackOfferEvent('offer_sidesheet_opened', {
      actor_kind: 'brand',
      source: 'conversation',
    })
    set({ isOpen: true, conversationId })
  },
  close: () => set({ isOpen: false, conversationId: null }),
}))
