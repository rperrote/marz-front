import { z } from 'zod'
import { t } from '@lingui/core/macro'

export function createFormInputSchema() {
  return z
    .object({
      websiteUrl: z.string(),
      descriptionText: z.string(),
      pdfFile: z.instanceof(File).nullable(),
    })
    .refine(
      (data) =>
        data.websiteUrl.trim().length > 0 ||
        data.descriptionText.trim().length > 0 ||
        data.pdfFile !== null,
      {
        message: t`Ingresá una descripción o subí un PDF.`,
        path: ['descriptionText'],
      },
    )
}

export function createWebsiteUrlFieldSchema() {
  return z
    .string()
    .refine(
      (val) => val.trim().length === 0 || /^https?:\/\/.+/.test(val.trim()),
      { message: t`Ingresá una URL válida (ej: https://mimarca.com)` },
    )
}

export function createPhase3Schema() {
  const scoringDimensionSchema = z.object({
    id: z.string(),
    name: z.string().min(1, t`El nombre es obligatorio.`),
    description: z.string(),
    weight_pct: z.number().int().min(1).max(100),
    positive_signals: z.array(z.string()),
    negative_signals: z.array(z.string()),
  })

  const hardFilterSchema = z.object({
    id: z.string(),
    filter_type: z.string().min(1, t`Seleccioná un tipo de filtro.`),
    filter_value: z.string().min(1, t`Ingresá un valor.`),
  })

  return z
    .object({
      campaign: z.object({
        name: z
          .string()
          .min(1, t`El nombre es obligatorio.`)
          .max(150),
        objective: z
          .string()
          .refine(
            (
              v,
            ): v is 'brand_awareness' | 'conversion' | 'engagement' | 'reach' =>
              ['brand_awareness', 'conversion', 'engagement', 'reach'].includes(
                v,
              ),
            { message: t`Seleccioná un objetivo.` },
          ),
        budget_amount: z
          .number()
          .positive(t`El presupuesto debe ser mayor a 0.`),
        budget_currency: z.string(),
        deadline: z.string().optional(),
      }),
      brief: z.object({
        icp_description: z.string().nullable(),
        icp_age_min: z.number().int().min(13).max(99).nullable(),
        icp_age_max: z.number().int().min(13).max(99).nullable(),
        icp_genders: z.array(z.enum(['male', 'female', 'non_binary'])),
        icp_countries: z.array(z.string().length(2)),
        icp_platforms: z.array(z.enum(['youtube', 'instagram', 'tiktok'])),
        icp_interests: z.array(z.string()),
        scoring_dimensions: z.array(scoringDimensionSchema).max(4),
        hard_filters: z.array(hardFilterSchema),
        disqualifiers: z.array(z.string()),
      }),
    })
    .superRefine((v, ctx) => {
      const dims = v.brief.scoring_dimensions
      // Empty scoring is allowed (partial brief when AI failed). Only enforce
      // the 100% rule if the user added dimensions.
      if (dims.length === 0) return
      const sum = dims.reduce((a, d) => a + d.weight_pct, 0)
      if (sum !== 100) {
        const currentSum = String(sum)
        ctx.addIssue({
          code: 'custom',
          path: ['brief', 'scoring_dimensions'],
          message: t`Los pesos deben sumar 100 (actual: ${currentSum}).`,
        })
      }
    })
}

export type Phase3Values = z.input<ReturnType<typeof createPhase3Schema>>
