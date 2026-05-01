import { create } from 'zustand'

import { trackOfferEvent } from '../analytics'

export type OfferType = 'single' | 'bundle' | 'multistage'

interface SendOfferSheetState {
  isOpen: boolean
  conversationId: string | null
  offerType: OfferType
  pendingOfferType: OfferType | null
  pendingOfferTypeHadData: boolean
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
    pendingOfferTypeHadData: false,
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
        pendingOfferTypeHadData: false,
        isTypeChangeConfirmationOpen: false,
      })
    },
    close: () =>
      set({
        isOpen: false,
        conversationId: null,
        offerType: 'single',
        pendingOfferType: null,
        pendingOfferTypeHadData: false,
        isTypeChangeConfirmationOpen: false,
      }),
    setOfferType: (type, options) => {
      const { offerType, isTypeChangeConfirmationOpen } = get()
      if (isTypeChangeConfirmationOpen) return
      if (type === offerType) return
      if (options?.hasData) {
        set({
          pendingOfferType: type,
          pendingOfferTypeHadData: true,
          isTypeChangeConfirmationOpen: true,
        })
      } else {
        trackOfferEvent('offer_type_changed_in_sidesheet', {
          actor_kind: 'brand',
          from_type: offerType,
          to_type: type,
          had_data: false,
        })
        set({ offerType: type, pendingOfferType: null })
      }
    },
    confirmTypeChange: () => {
      const { offerType, pendingOfferType, pendingOfferTypeHadData } = get()
      if (pendingOfferType) {
        trackOfferEvent('offer_type_changed_in_sidesheet', {
          actor_kind: 'brand',
          from_type: offerType,
          to_type: pendingOfferType,
          had_data: pendingOfferTypeHadData,
        })
        set({
          offerType: pendingOfferType,
          pendingOfferType: null,
          pendingOfferTypeHadData: false,
          isTypeChangeConfirmationOpen: false,
        })
      }
    },
    cancelTypeChange: () =>
      set({
        pendingOfferType: null,
        pendingOfferTypeHadData: false,
        isTypeChangeConfirmationOpen: false,
      }),
  }),
)
