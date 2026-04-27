import { z } from 'zod'

const offerSpeedBonusSchema = z.object({
  early_deadline: z.string(),
  bonus_amount: z.string(),
  currency: z.string(),
})

export const offerSnapshotSchema = z.object({
  offer_id: z.string(),
  campaign_id: z.string(),
  campaign_name: z.string(),
  type: z.literal('single'),
  platform: z.string(),
  format: z.string(),
  total_amount: z.string(),
  currency: z.string(),
  deadline: z.string(),
  speed_bonus: offerSpeedBonusSchema.nullable(),
  sent_at: z.string(),
  expires_at: z.string(),
})

export const offerAcceptedSnapSchema = offerSnapshotSchema.extend({
  accepted_at: z.string(),
})
