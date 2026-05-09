import { z } from 'zod'
import { t } from '@lingui/core/macro'
import { todayString } from '../utils/dateUtils'
import { offerBonusTermsFormSchema } from './bonusTerms'

const bundleDeliverableSchema = z.object({
  id: z.string(),
  platform: z.string().min(1, t`Select a platform`),
  format: z.string().min(1, t`Select a format`),
  quantity: z.number().min(1, t`Minimum 1`),
  amount: z.string().refine((val) => val.length === 0 || parseFloat(val) > 0, {
    message: t`Amount must be greater than 0`,
  }),
})

export const bundleEditorBaseSchema = z.object({
  campaign_id: z.string().min(1, t`Select a campaign`),
  total_amount: z
    .string()
    .min(1, t`Enter a total amount`)
    .regex(/^\d+\.\d{2}$/, t`Use format 0.00`)
    .refine((val) => parseFloat(val) > 0, {
      message: t`Amount must be greater than 0`,
    }),
  deadline: z
    .string()
    .min(1, t`Select a deadline`)
    .refine((val) => val > todayString(), {
      message: t`Deadline must be a future date`,
    }),
  bonus_terms: offerBonusTermsFormSchema,
  deliverables: z
    .array(bundleDeliverableSchema)
    .min(2, t`Minimum 2 deliverables`),
})

export const bundleEditorSubmitSchema = bundleEditorBaseSchema.superRefine(
  (data, ctx) => {
    const declared = data.deliverables.filter((d) => d.amount.length > 0)
    // Partial declaration
    if (declared.length > 0 && declared.length !== data.deliverables.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t`Declare all amounts or none`,
        path: ['deliverables'],
      })
      return
    }
    // Sum mismatch
    if (declared.length === data.deliverables.length) {
      const sum = declared.reduce((acc, d) => acc + parseFloat(d.amount), 0)
      if (Math.abs(sum - parseFloat(data.total_amount)) >= 0.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`Amounts must sum to total`,
          path: ['total_amount'],
        })
      }
    }
  },
)
