import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BrandOnboardingPayload } from '#/shared/api/generated/model/brandOnboardingPayload'
import { STEPS } from './steps'

const sessionStorageSSR = createJSONStorage<BrandOnboardingState>(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage,
)

export type FieldErrors = Partial<Record<keyof BrandOnboardingPayload, string>>

export type BrandOnboardingState = Partial<BrandOnboardingPayload> & {
  currentStepIndex: number
  fieldErrors: FieldErrors
  setField: <TKey extends keyof BrandOnboardingPayload>(
    key: TKey,
    value: BrandOnboardingPayload[TKey],
  ) => void
  setFieldErrors: (errors: FieldErrors) => void
  clearFieldErrors: () => void
  goTo: (index: number) => void
  reset: () => void
}

const STORAGE_KEY = 'marz-brand-onboarding'

export const useBrandOnboardingStore = create<BrandOnboardingState>()(
  persist(
    (set) => ({
      currentStepIndex: 0,
      fieldErrors: {},
      setField: (key, value) =>
        set((state) => ({
          [key]: value,
          fieldErrors: { ...state.fieldErrors, [key]: undefined },
        })),
      setFieldErrors: (errors: FieldErrors) => set({ fieldErrors: errors }),
      clearFieldErrors: () => set({ fieldErrors: {} }),
      goTo: (index: number) =>
        set({
          currentStepIndex: Math.min(Math.max(0, index), STEPS.length - 1),
        }),
      reset: () => {
        set({
          currentStepIndex: 0,
          fieldErrors: {},
          name: undefined,
          website_url: undefined,
          primary_color_hex: undefined,
          secondary_color_hex: undefined,
          brandfetch_snapshot: undefined,
          vertical: undefined,
          marketing_objective: undefined,
          creator_experience: undefined,
          creator_sourcing_intent: undefined,
          monthly_budget_range: undefined,
          timing: undefined,
          attribution: undefined,
          contact_name: undefined,
          contact_title: undefined,
          contact_whatsapp_e164: undefined,
        })
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
