import { z } from 'zod'

export const formInputSchema = z
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
      message: 'Ingresá una descripción o subí un PDF.',
      path: ['descriptionText'],
    },
  )

export const websiteUrlFieldSchema = z
  .string()
  .refine(
    (val) => val.trim().length === 0 || /^https?:\/\/.+/.test(val.trim()),
    { message: 'Ingresá una URL válida (ej: https://mimarca.com)' },
  )

const scoringDimensionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es obligatorio.'),
  description: z.string(),
  weight_pct: z.number().int().min(1).max(100),
  positive_signals: z.array(z.string()),
  negative_signals: z.array(z.string()),
})

const hardFilterSchema = z.object({
  id: z.string(),
  filter_type: z.string().min(1, 'Seleccioná un tipo de filtro.'),
  filter_value: z.string().min(1, 'Ingresá un valor.'),
})

export const phase3Schema = z
  .object({
    campaign: z.object({
      name: z.string().min(1, 'El nombre es obligatorio.').max(150),
      objective: z
        .string()
        .refine(
          (v): v is 'brand_awareness' | 'conversion' | 'engagement' | 'reach' =>
            ['brand_awareness', 'conversion', 'engagement', 'reach'].includes(
              v,
            ),
          { message: 'Seleccioná un objetivo.' },
        ),
      budget_amount: z.number().positive('El presupuesto debe ser mayor a 0.'),
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
      scoring_dimensions: z.array(scoringDimensionSchema).min(1).max(4),
      hard_filters: z.array(hardFilterSchema),
      disqualifiers: z.array(z.string()),
    }),
  })
  .superRefine((v, ctx) => {
    const sum = v.brief.scoring_dimensions.reduce((a, d) => a + d.weight_pct, 0)
    if (sum !== 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['brief', 'scoring_dimensions'],
        message: `Los pesos deben sumar 100 (actual: ${String(sum)}).`,
      })
    }
  })

export type Phase3Values = z.input<typeof phase3Schema>

export type FormInputValues = z.infer<typeof formInputSchema>
