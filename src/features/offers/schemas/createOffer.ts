import { z } from 'zod'

import type { OfferBonusTerms } from '#/shared/api/generated/model'

export const OFFER_PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/
const bonusPercentageRegex = /^\d+(\.\d{1,2})?$/

export function getMinimumTentativePublishDateUTC(referenceDate = new Date()) {
  const minimumDate = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate() + 4,
    ),
  )

  return minimumDate.toISOString().slice(0, 10)
}

export const bonusAmountSchema = z.string().regex(bonusPercentageRegex)

export const bonusTermsSchema: z.ZodType<OfferBonusTerms> = z.object({
  speed_bonus_windows: z.array(
    z.object({
      window_hours: z.number().int().min(1).max(720),
      bonus_pct: bonusAmountSchema,
    }),
  ),
})

export const createOfferSchema = z
  .object({
    campaign_id: z.uuid(),
    creator_account_id: z.uuid(),
    offer_mode: z.enum(['same_content', 'per_platform']),
    amount: z.number().positive(),
    tentative_publish_date: z.string().regex(dateOnlyRegex),
    offer_deadline: z.string().regex(dateOnlyRegex),
    platforms: z.array(z.enum(OFFER_PLATFORMS)).min(1),
    bonus_terms: bonusTermsSchema.optional(),
  })
  .superRefine((offer, ctx) => {
    if (offer.tentative_publish_date < getMinimumTentativePublishDateUTC()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tentative publish date must be at least four days from today',
        path: ['tentative_publish_date'],
      })
    }

    if (offer.offer_deadline < offer.tentative_publish_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Offer deadline must be on or after tentative publish date',
        path: ['offer_deadline'],
      })
    }

    if (new Set(offer.platforms).size !== offer.platforms.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Platforms must not contain duplicates',
        path: ['platforms'],
      })
    }

    if (offer.offer_mode !== 'per_platform' || !offer.bonus_terms) return

    if (offer.bonus_terms.speed_bonus_windows.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Per-platform offers cannot include speed bonus windows',
        path: ['bonus_terms', 'speed_bonus_windows'],
      })
    }
  })

export type CreateOfferFormValues = z.infer<typeof createOfferSchema>
