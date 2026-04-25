import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { PHASES } from './phases'

export interface PdfMeta {
  fileName: string
  sizeBytes: number
  pageCount: number
}

export interface BriefDraft {
  title: string
  objective: string
  targetAudience: string
  deliverables: string[]
  budget: string
  timeline: string
}

export type Phase = 1 | 2 | 3 | 4

export interface BriefBuilderState {
  currentPhase: Phase
  processingToken: string | null
  formInput: {
    websiteUrl: string
    descriptionText: string
    pdfMeta: PdfMeta | null
  }
  briefDraft: BriefDraft | null
  campaignId: string | null
  setField: <TKey extends keyof BriefBuilderState>(
    key: TKey,
    value: BriefBuilderState[TKey],
  ) => void
  goTo: (phase: Phase) => void
  reset: () => void
}

const STORAGE_KEY = 'marz-brief-builder'

const INITIAL_STATE = {
  currentPhase: 1 as Phase,
  processingToken: null,
  formInput: {
    websiteUrl: '',
    descriptionText: '',
    pdfMeta: null,
  },
  briefDraft: null,
  campaignId: null,
}

const sessionStorageSSR = createJSONStorage<BriefBuilderState>(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage,
)

export const useBriefBuilderStore = create<BriefBuilderState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setField: (key, value) => set({ [key]: value }),
      goTo: (phase) =>
        set({
          currentPhase: Math.min(Math.max(1, phase), PHASES.length) as Phase,
        }),
      reset: () => {
        set(INITIAL_STATE)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: sessionStorageSSR,
      skipHydration: true,
    },
  ),
)
