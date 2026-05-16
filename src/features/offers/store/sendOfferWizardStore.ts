import { create } from 'zustand'

import type {
  CreateOfferFormValues,
  OfferBonusTermsFormValues,
} from '../schemas/createOffer'

export type SendOfferWizardMode = 'same_content' | 'per_platform'

export type SendOfferWizardState = {
  isOpen: boolean
  conversationId: string | null
  mode: SendOfferWizardMode
  draft: Partial<CreateOfferFormValues>
  bonusesEnabledGlobal: boolean
  bonusesSnapshot: OfferBonusTermsFormValues | null
  open: (conversationId: string) => void
  close: () => void
  setMode: (mode: SendOfferWizardMode) => void
  patchDraft: (patch: Partial<CreateOfferFormValues>) => void
  setBonusesEnabledGlobal: (enabled: boolean) => void
  setBonusesSnapshot: (snapshot: OfferBonusTermsFormValues | null) => void
  reset: () => void
}

const getInitialState = () => ({
  isOpen: false,
  conversationId: null,
  mode: 'same_content' as const,
  draft: {},
  bonusesEnabledGlobal: false,
  bonusesSnapshot: null,
})

export const useSendOfferWizard = create<SendOfferWizardState>()((set) => ({
  ...getInitialState(),
  open: (conversationId) => set({ isOpen: true, conversationId }),
  close: () => set({ isOpen: false, conversationId: null }),
  setMode: (mode) => set({ mode }),
  patchDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),
  setBonusesEnabledGlobal: (enabled) => set({ bonusesEnabledGlobal: enabled }),
  setBonusesSnapshot: (snapshot) => set({ bonusesSnapshot: snapshot }),
  reset: () => set(getInitialState()),
}))
