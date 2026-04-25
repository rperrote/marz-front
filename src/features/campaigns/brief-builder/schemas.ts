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

export const briefDraftSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio.'),
  objective: z.string(),
  targetAudience: z.string(),
  deliverablesText: z.string(),
  budget: z.string(),
  timeline: z.string(),
})

export type FormInputValues = z.infer<typeof formInputSchema>
export type BriefDraftFormValues = z.infer<typeof briefDraftSchema>
