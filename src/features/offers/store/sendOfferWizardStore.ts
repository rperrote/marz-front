import { create } from 'zustand'

import type {
  CreateOfferRequest,
  OfferBonusTerms as BonusTerms,
} from '#/shared/api/generated/model'

export type SendOfferWizardMode = 'same_content' | 'per_platform'

export type SendOfferWizardState = {
  mode: SendOfferWizardMode
  sameContent: Partial<CreateOfferRequest>
  perPlatform: Partial<CreateOfferRequest>
  bonusesEnabledGlobal: boolean
  bonusesSnapshot: BonusTerms | null
  setMode: (mode: SendOfferWizardMode) => void
  patchSameContent: (patch: Partial<CreateOfferRequest>) => void
  patchPerPlatform: (patch: Partial<CreateOfferRequest>) => void
  setBonusesEnabledGlobal: (enabled: boolean) => void
  setBonusesSnapshot: (snapshot: BonusTerms | null) => void
  reset: () => void
}

const getInitialState = () => ({
  mode: 'same_content' as const,
  sameContent: {},
  perPlatform: {},
  bonusesEnabledGlobal: false,
  bonusesSnapshot: null,
})

function mergeCreateOfferDraft(
  current: Partial<CreateOfferRequest>,
  patch: Partial<CreateOfferRequest>,
) {
  // TypeScript cannot preserve Partial<CreateOfferRequest> through object spread over generated union members.
  return { ...current, ...patch } as Partial<CreateOfferRequest>
}

export const useSendOfferWizard = create<SendOfferWizardState>()((set) => ({
  ...getInitialState(),
  setMode: (mode) => set({ mode }),
  patchSameContent: (patch) =>
    set((state) => ({
      sameContent: mergeCreateOfferDraft(state.sameContent, patch),
    })),
  patchPerPlatform: (patch) =>
    set((state) => ({
      perPlatform: mergeCreateOfferDraft(state.perPlatform, patch),
    })),
  setBonusesEnabledGlobal: (enabled) => set({ bonusesEnabledGlobal: enabled }),
  setBonusesSnapshot: (snapshot) => set({ bonusesSnapshot: snapshot }),
  reset: () => set(getInitialState()),
}))
