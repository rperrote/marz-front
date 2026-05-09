import type { BestVideoKind } from '#/shared/api/generated/model/bestVideoKind'

export interface CreatorRateCard {
  format: string
  rate_amount: string
  rate_currency: string
}

export interface CreatorChannel {
  platform: string
  external_handle: string
  external_url?: string | null
  followers?: number | null
  verified: boolean
  is_primary: boolean
  rate_cards: CreatorRateCard[]
}

export interface BestVideo {
  url: string
  kind: BestVideoKind
}

export const CreatorOnboardingPayloadGender = {
  male: 'male',
  female: 'female',
  non_binary: 'non_binary',
  prefer_not_say: 'prefer_not_say',
} as const

export type CreatorOnboardingPayloadGender =
  | (typeof CreatorOnboardingPayloadGender)[keyof typeof CreatorOnboardingPayloadGender]
  | null

export const CreatorOnboardingPayloadExperienceLevel = {
  none: 'none',
  '1_to_5': '1_to_5',
  '6_to_20': '6_to_20',
  '20_plus_primary': '20_plus_primary',
} as const

export type CreatorOnboardingPayloadExperienceLevel =
  (typeof CreatorOnboardingPayloadExperienceLevel)[keyof typeof CreatorOnboardingPayloadExperienceLevel]

export const CreatorOnboardingPayloadTier = {
  emergent: 'emergent',
  growing: 'growing',
  consolidated: 'consolidated',
  reference: 'reference',
  massive: 'massive',
  celebrity: 'celebrity',
} as const

export type CreatorOnboardingPayloadTier =
  (typeof CreatorOnboardingPayloadTier)[keyof typeof CreatorOnboardingPayloadTier]

export type AvatarPresignRequestContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

export interface CreatorOnboardingPayload {
  handle: string
  display_name: string
  bio?: string | null
  niches: string[]
  content_types: string[]
  country: string
  city?: string | null
  avatar_s3_key: string
  birthday: string
  whatsapp_e164: string
  gender?: string | null
  experience_level: string
  channels: CreatorChannel[]
  best_videos: BestVideo[]
  referral_text?: string | null
  tier: string
}
