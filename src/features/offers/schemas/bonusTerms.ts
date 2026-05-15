import { z } from 'zod'
import { t } from '@lingui/core/macro'

const decimalStringRegex = /^\d+(\.\d{1,2})?$/

function createOfferBonusTermsSchemas() {
  const offerSpeedBonusWindowFormSchema = z.object({
    id: z.string(),
    window_hours: z
      .number({ error: t`Enter hours` })
      .int(t`Hours must be a whole number`)
      .min(1, t`Minimum 1 hour`),
    bonus_pct: z
      .string()
      .min(1, t`Enter a bonus percentage`)
      .regex(decimalStringRegex, t`Use a valid percentage`)
      .refine((value) => parseFloat(value) > 0, {
        message: t`Bonus percentage must be greater than 0`,
      }),
  })

  const offerBonusTermsFormSchema = z.object({
    speed_bonus_windows: z.array(offerSpeedBonusWindowFormSchema),
  })

  return { offerBonusTermsFormSchema }
}

export { createOfferBonusTermsSchemas }
