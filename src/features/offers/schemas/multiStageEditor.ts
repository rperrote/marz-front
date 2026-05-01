import { z } from 'zod'
import { t } from '@lingui/core/macro'

const stageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, t`Enter a stage name`),
  description: z.string(),
  deadline: z.string().min(1, t`Select a deadline`),
  amount: z.string().min(1, t`Enter an amount`),
})

export const multiStageEditorBaseSchema = z.object({
  campaign_id: z.string().min(1, t`Select a campaign`),
  stages: z.array(stageSchema).min(2, t`Minimum 2 stages`),
})

export const multiStageEditorSubmitSchema =
  multiStageEditorBaseSchema.superRefine((data, ctx) => {
    data.stages.forEach((stage, index) => {
      if (stage.amount.length > 0) {
        const val = parseFloat(stage.amount)
        if (isNaN(val) || val <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t`Amount must be greater than 0`,
            path: ['stages', index, 'amount'],
          })
        }
      }
    })

    for (let i = 1; i < data.stages.length; i++) {
      const prev = data.stages[i - 1]!.deadline
      const curr = data.stages[i]!.deadline
      if (curr.length > 0 && prev.length > 0 && curr <= prev) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`Must be after the previous stage`,
          path: ['stages', i, 'deadline'],
        })
      }
    }
  })
