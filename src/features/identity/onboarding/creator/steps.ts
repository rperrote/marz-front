import type { ComponentType } from 'react'
import type { CreatorOnboardingState } from './store'
import {
  C1NameHandleScreen,
  C2ExperienceScreen,
  C3PrimingBrandsWaiting,
  C4TierScreen,
  C5NichesScreen,
  C6ContentTypesScreen,
  C7ChannelsScreen,
  C8PrimingTestimonials,
  C8bPrimingBenchmark,
  C9PrimingBenchmark2,
  C10BestVideosScreen,
  C11BirthdayScreen,
  C12GenderScreen,
  C13LocationScreen,
  C14PrimingNumbers,
  C15WhatsappScreen,
  C16ReferralScreen,
  C17AvatarScreen,
  C18PrimingEarnings,
  C19PrimingSocialProof,
  C20ConfirmationScreen,
} from './screens'

export interface CreatorOnboardingStep {
  id: string
  component: ComponentType
  validate?: (state: CreatorOnboardingState) => boolean
}

export const STEPS: CreatorOnboardingStep[] = [
  {
    id: 'name-handle',
    component: C1NameHandleScreen,
    validate: (s) =>
      typeof s.display_name === 'string' &&
      s.display_name.trim().length > 0 &&
      typeof s.handle === 'string' &&
      /^[a-z0-9_]{3,30}$/.test(s.handle),
  },
  {
    id: 'experience',
    component: C2ExperienceScreen,
    validate: (s) =>
      typeof s.experience_level === 'string' && s.experience_level.length > 0,
  },
  {
    id: 'priming-brands-waiting',
    component: C3PrimingBrandsWaiting,
  },
  {
    id: 'tier',
    component: C4TierScreen,
    validate: (s) => typeof s.tier === 'string' && s.tier.length > 0,
  },
  {
    id: 'niches',
    component: C5NichesScreen,
    validate: (s) =>
      Array.isArray(s.niches) && s.niches.length >= 1 && s.niches.length <= 5,
  },
  {
    id: 'content-types',
    component: C6ContentTypesScreen,
    validate: (s) =>
      Array.isArray(s.content_types) && s.content_types.length >= 1,
  },
  {
    id: 'channels',
    component: C7ChannelsScreen,
    validate: (s) =>
      Array.isArray(s.channels) &&
      s.channels.length >= 1 &&
      s.channels.filter((c) => c.is_primary).length === 1,
  },
  {
    id: 'priming-testimonials',
    component: C8PrimingTestimonials,
  },
  {
    id: 'priming-benchmark',
    component: C8bPrimingBenchmark,
  },
  {
    id: 'priming-benchmark-2',
    component: C9PrimingBenchmark2,
  },
  {
    id: 'best-videos',
    component: C10BestVideosScreen,
    validate: (s) =>
      Array.isArray(s.best_videos) &&
      s.best_videos.length === 3 &&
      s.best_videos.every(
        (v) => typeof v.url === 'string' && v.url.trim().length > 0,
      ),
  },
  {
    id: 'birthday',
    component: C11BirthdayScreen,
    validate: (s) =>
      typeof s.birthday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.birthday),
  },
  {
    id: 'gender',
    component: C12GenderScreen,
  },
  {
    id: 'location',
    component: C13LocationScreen,
    validate: (s) =>
      typeof s.country === 'string' && /^[A-Z]{2}$/.test(s.country),
  },
  {
    id: 'priming-numbers',
    component: C14PrimingNumbers,
  },
  {
    id: 'whatsapp',
    component: C15WhatsappScreen,
    validate: (s) =>
      typeof s.whatsapp_e164 === 'string' &&
      /^\+[1-9]\d{1,14}$/.test(s.whatsapp_e164),
  },
  {
    id: 'referral',
    component: C16ReferralScreen,
  },
  {
    id: 'avatar',
    component: C17AvatarScreen,
    validate: (s) =>
      typeof s.avatar_s3_key === 'string' && s.avatar_s3_key.length > 0,
  },
  {
    id: 'priming-earnings',
    component: C18PrimingEarnings,
  },
  {
    id: 'priming-social-proof',
    component: C19PrimingSocialProof,
  },
  {
    id: 'confirmation',
    component: C20ConfirmationScreen,
  },
]

export function getStepIndex(stepId: string): number {
  return STEPS.findIndex((s) => s.id === stepId)
}

export function getStepId(index: number): string {
  return STEPS[Math.min(Math.max(0, index), STEPS.length - 1)]!.id
}
