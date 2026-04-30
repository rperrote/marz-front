import { create } from 'zustand'

import { trackOfferEvent } from '../analytics'

export type OfferType = 'single' | 'bundle' | 'multistage'

interface SendOfferSheetState {
  isOpen: boolean
  conversationId: string | null
  offerType: OfferType
  pendingOfferType: OfferType | null
  isTypeChangeConfirmationOpen: boolean
  open: (conversationId: string) => void
  close: () => void
  setOfferType: (type: OfferType, options?: { hasData?: boolean }) => void
  confirmTypeChange: () => void
  cancelTypeChange: () => void
}

export const useSendOfferSheetStore = create<SendOfferSheetState>()(
  (set, get) => ({
    isOpen: false,
    conversationId: null,
    offerType: 'single',
    pendingOfferType: null,
    isTypeChangeConfirmationOpen: false,
    open: (conversationId) => {
      trackOfferEvent('offer_sidesheet_opened', {
        actor_kind: 'brand',
        source: 'conversation',
      })
      set({
        isOpen: true,
        conversationId,
        offerType: 'single',
        pendingOfferType: null,
        isTypeChangeConfirmationOpen: false,
      })
    },
    close: () =>
      set({
        isOpen: false,
        conversationId: null,
        offerType: 'single',
        pendingOfferType: null,
        isTypeChangeConfirmationOpen: false,
      }),
    setOfferType: (type, options) => {
      const { offerType, isTypeChangeConfirmationOpen } = get()
      if (isTypeChangeConfirmationOpen) return
      if (type === offerType) return
      if (options?.hasData) {
        set({ pendingOfferType: type, isTypeChangeConfirmationOpen: true })
      } else {
        set({ offerType: type, pendingOfferType: null })
      }
    },
    confirmTypeChange: () => {
      const { pendingOfferType } = get()
      if (pendingOfferType) {
        set({
          offerType: pendingOfferType,
          pendingOfferType: null,
          isTypeChangeConfirmationOpen: false,
        })
      }
    },
    cancelTypeChange: () =>
      set({ pendingOfferType: null, isTypeChangeConfirmationOpen: false }),
  }),
)
