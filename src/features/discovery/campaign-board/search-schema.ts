import { z } from 'zod'

const campaignBoardSortSchema = z.enum([
  'match_score_desc',
  'fee_desc',
  'deadline_asc',
  'recent_desc',
])

const campaignBoardPlatformSchema = z.enum(['instagram', 'tiktok', 'youtube'])

const decimalAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/)

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

function stringOrStringArrayToArray(value: unknown) {
  if (value === '') return undefined
  if (typeof value === 'string') return [value]
  return value
}

function booleanSearchParam(value: unknown) {
  if (value === undefined || typeof value === 'boolean') return value
  if (typeof value !== 'string') return value

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false

  return value
}

const stringArraySchema = (maxLength: number) =>
  z.preprocess(
    stringOrStringArrayToArray,
    z.array(z.string().trim().min(1)).max(maxLength).optional(),
  )

export const CampaignBoardSearchSchema = z
  .object({
    q: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(80).optional(),
    ),
    niches: stringArraySchema(10),
    interests: stringArraySchema(20),
    platforms: z.preprocess(
      stringOrStringArrayToArray,
      z.array(campaignBoardPlatformSchema).max(3).optional(),
    ),
    deliverables: stringArraySchema(10),
    fee_min_amount: z.preprocess(
      emptyStringToUndefined,
      decimalAmountSchema.optional(),
    ),
    fee_max_amount: z.preprocess(
      emptyStringToUndefined,
      decimalAmountSchema.optional(),
    ),
    min_match_score: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().min(0).max(100).optional(),
    ),
    recommended_only: z
      .preprocess(booleanSearchParam, z.boolean().optional())
      .default(false),
    sort: campaignBoardSortSchema.default('match_score_desc'),
    cursor: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).optional(),
    ),
  })
  .superRefine((search, context) => {
    if (
      search.fee_min_amount === undefined ||
      search.fee_max_amount === undefined
    ) {
      return
    }

    if (Number(search.fee_max_amount) < Number(search.fee_min_amount)) {
      context.addIssue({
        code: 'custom',
        path: ['fee_max_amount'],
        message:
          'fee_max_amount must be greater than or equal to fee_min_amount',
      })
    }
  })

export type CampaignBoardSearch = z.infer<typeof CampaignBoardSearchSchema>
