import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { PHASES } from './phases'

export interface PdfMeta {
  fileName: string
  sizeBytes: number
  pageCount: number
}

export type CampaignObjective =
  | 'brand_awareness'
  | 'conversion'
  | 'engagement'
  | 'reach'

export type Gender = 'male' | 'female' | 'non_binary'
export type Platform = 'youtube' | 'instagram' | 'tiktok'

export interface ScoringDimension {
  id: string
  name: string
  description: string
  weight_pct: number
  positive_signals: string[]
  negative_signals: string[]
}

export interface HardFilter {
  filter_type: string
  filter_value: string
}

export interface BriefDraft {
  campaign: {
    name: string
    objective: CampaignObjective | ''
    budget_amount: number | null
    budget_currency: string
    deadline: string
  }
  brief: {
    icp_description: string | null
    icp_age_min: number | null
    icp_age_max: number | null
    icp_genders: Gender[]
    icp_countries: string[]
    icp_platforms: Platform[]
    icp_interests: string[]
    scoring_dimensions: ScoringDimension[]
    hard_filters: HardFilter[]
    disqualifiers: string[]
  }
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
  pdfFile: File | null
  briefDraft: BriefDraft | null
  campaignId: string | null
  setField: <TKey extends keyof BriefBuilderState>(
    key: TKey,
    value: BriefBuilderState[TKey],
  ) => void
  setPdfFile: (file: File | null) => void
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
  pdfFile: null as File | null,
  briefDraft: null,
  campaignId: null,
}

type PersistedBriefBuilderState = Omit<BriefBuilderState, 'pdfFile'>

const sessionStorageSSR = createJSONStorage<PersistedBriefBuilderState>(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage,
)

export const useBriefBuilderStore = create<BriefBuilderState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setField: (key, value) => set({ [key]: value }),
      setPdfFile: (file) =>
        set((prev) => ({
          pdfFile: file,
          formInput: {
            ...prev.formInput,
            pdfMeta: file
              ? { fileName: file.name, sizeBytes: file.size, pageCount: 0 }
              : null,
          },
        })),
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
      partialize: ({
        pdfFile: _,
        ...rest
      }): Omit<BriefBuilderState, 'pdfFile'> => rest,
      skipHydration: true,
    },
  ),
)
