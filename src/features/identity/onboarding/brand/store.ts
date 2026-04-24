import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BrandOnboardingPayload } from '#/shared/api/generated/model/brandOnboardingPayload'
import { STEPS } from './steps'

const sessionStorageSSR = createJSONStorage<BrandOnboardingState>(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage,
)

export type BrandOnboardingState = Partial<BrandOnboardingPayload> & {
  currentStepIndex: number
  setField: <TKey extends keyof BrandOnboardingPayload>(
    key: TKey,
    value: BrandOnboardingPayload[TKey],
  ) => void
  goTo: (index: number) => void
  reset: () => void
}

export const useBrandOnboardingStore = create<BrandOnboardingState>()(
  persist(
    (set) => ({
      currentStepIndex: 0,
      setField: (key, value) =>
        set({ [key]: value } as Partial<BrandOnboardingState>),
      goTo: (index: number) =>
        set({
          currentStepIndex: Math.min(Math.max(0, index), STEPS.length - 1),
        }),
      reset: () => set({ currentStepIndex: 0 }),
    }),
    {
      name: 'marz-brand-onboarding',
      storage: sessionStorageSSR,
      skipHydration: true,
    },
  ),
)
