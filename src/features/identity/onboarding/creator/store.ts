import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CreatorOnboardingPayload } from '#/shared/api/generated/model/creatorOnboardingPayload'
import { STEPS } from './steps'

const sessionStorageSSR = createJSONStorage<CreatorOnboardingState>(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage,
)

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

const STORAGE_KEY = 'marz-creator-onboarding'

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
