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

export const bundleDeliverableSnapshotSchema = z.object({
  platform: z.string(),
  format: z.string(),
  quantity: z.number(),
  amount: z.string(),
})

export const offerSnapshotBundleSchema = z.object({
  offer_id: z.string(),
  campaign_id: z.string(),
  campaign_name: z.string(),
  type: z.literal('bundle'),
  total_amount: z.string(),
  currency: z.string(),
  deadline: z.string(),
  speed_bonus: offerSpeedBonusSchema.nullable(),
  sent_at: z.string(),
  expires_at: z.string(),
  deliverables: z.array(bundleDeliverableSnapshotSchema),
})

export const multiStageItemSnapshotSchema = z.object({
  name: z.string(),
  description: z.string(),
  deadline: z.string(),
  amount: z.string(),
})

export const offerSnapshotMultiStageSchema = z.object({
  offer_id: z.string(),
  campaign_id: z.string(),
  campaign_name: z.string(),
  type: z.literal('multistage'),
  total_amount: z.string(),
  currency: z.string(),
  deadline: z.string(),
  sent_at: z.string(),
  expires_at: z.string(),
  stages: z.array(multiStageItemSnapshotSchema),
})
