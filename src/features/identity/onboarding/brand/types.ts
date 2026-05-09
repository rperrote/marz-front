export const Vertical = {
  fintech: 'fintech',
  tech: 'tech',
  ecommerce: 'ecommerce',
  education: 'education',
  food: 'food',
  fitness: 'fitness',
  health: 'health',
  entertainment: 'entertainment',
  beauty: 'beauty',
  gaming: 'gaming',
  travel: 'travel',
  fashion: 'fashion',
  mobile_apps: 'mobile_apps',
  crypto: 'crypto',
  ai_tech: 'ai_tech',
  other: 'other',
} as const

export type Vertical = (typeof Vertical)[keyof typeof Vertical]

export const MarketingObjective = {
  awareness: 'awareness',
  performance: 'performance',
  launch: 'launch',
  community: 'community',
} as const

export type MarketingObjective =
  (typeof MarketingObjective)[keyof typeof MarketingObjective]

export const MonthlyBudgetRange = {
  zero: 'zero',
  under_10k: 'under_10k',
  '10k_to_25k': '10k_to_25k',
  '25k_to_50k': '25k_to_50k',
  '50k_plus': '50k_plus',
} as const

export type MonthlyBudgetRange =
  (typeof MonthlyBudgetRange)[keyof typeof MonthlyBudgetRange]

export const AttributionNonReferralSource = {
  instagram: 'instagram',
  twitter_x: 'twitter_x',
  search: 'search',
  other: 'other',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  reddit: 'reddit',
} as const

export type AttributionNonReferralSource =
  (typeof AttributionNonReferralSource)[keyof typeof AttributionNonReferralSource]

export type Attribution =
  | { source: 'referral'; referral_text: string }
  | { source: AttributionNonReferralSource }

export const CreatorExperience = {
  never: 'never',
  scaling: 'scaling',
  tried_without_results: 'tried_without_results',
} as const

export type CreatorExperience =
  (typeof CreatorExperience)[keyof typeof CreatorExperience]

export const CreatorSourcingIntent = {
  already_have: 'already_have',
  discover_in_marz: 'discover_in_marz',
  both: 'both',
} as const

export type CreatorSourcingIntent =
  (typeof CreatorSourcingIntent)[keyof typeof CreatorSourcingIntent]

export const Timing = {
  launch_now: 'launch_now',
  one_to_two_weeks: 'one_to_two_weeks',
  this_month: 'this_month',
  exploring: 'exploring',
} as const

export type Timing = (typeof Timing)[keyof typeof Timing]

export interface BrandOnboardingPayload {
  name: string
  website_url?: string | null
  primary_color_hex?: string | null
  secondary_color_hex?: string | null
  brandfetch_snapshot?: unknown
  vertical: Vertical
  marketing_objective: MarketingObjective
  creator_experience: CreatorExperience
  creator_sourcing_intent: CreatorSourcingIntent
  monthly_budget_range: MonthlyBudgetRange
  timing: Timing
  attribution: Attribution
  contact_name: string
  contact_title: string
  contact_whatsapp_e164: string
}
