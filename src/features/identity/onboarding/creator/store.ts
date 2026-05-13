import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STEPS } from './steps'
import type { CreatorOnboardingPayload } from './types'

const LEGACY_STORAGE_KEY = 'marz-creator-onboarding'
const STORAGE_KEY = 'marz-creator-onboarding:v1'

const sessionStorageSSR = createJSONStorage<CreatorOnboardingState>(() => {
  if (typeof window === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
  const purgeLegacy = () => sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  return {
    getItem: (key: string) => {
      purgeLegacy()
      return sessionStorage.getItem(key)
    },
    setItem: (key: string, value: string) => {
      purgeLegacy()
      sessionStorage.setItem(key, value)
    },
    removeItem: (key: string) => {
      purgeLegacy()
      sessionStorage.removeItem(key)
    },
  }
})

export type FieldErrors = Partial<
  Record<keyof CreatorOnboardingPayload, string>
>

export type CreatorOnboardingState = Partial<CreatorOnboardingPayload> & {
  currentStepIndex: number
  fieldErrors: FieldErrors
  setField: <TKey extends keyof CreatorOnboardingPayload>(
    key: TKey,
    value: CreatorOnboardingPayload[TKey],
  ) => void
  setFieldErrors: (errors: FieldErrors) => void
  clearFieldErrors: () => void
  goTo: (index: number) => void
  reset: () => void
}

export const useCreatorOnboardingStore = create<CreatorOnboardingState>()(
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
          handle: undefined,
          display_name: undefined,
          bio: undefined,
          niches: undefined,
          content_types: undefined,
          country: undefined,
          city: undefined,
          avatar_s3_key: undefined,
          birthday: undefined,
          whatsapp_e164: undefined,
          gender: undefined,
          experience_level: undefined,
          channels: undefined,
          best_videos: undefined,
          referral_text: undefined,
          tier: undefined,
        })
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY)
          sessionStorage.removeItem(LEGACY_STORAGE_KEY)
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
