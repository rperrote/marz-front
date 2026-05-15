import { t } from '@lingui/core/macro'
import { z } from 'zod'

export const OFFER_PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/

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

export function createBonusAmountSchema() {
  return z.discriminatedUnion('type', [
    z.object({
      type: z.literal('percentage'),
      value: z
        .number()
        .int(t`El porcentaje tiene que ser un número entero`)
        .min(1, t`El porcentaje tiene que ser mayor a 0`)
        .max(100, t`El porcentaje no puede superar 100`),
    }),
    z.object({
      type: z.literal('fixed'),
      amount_usd: z.number().positive(t`El bono fijo tiene que ser mayor a 0`),
    }),
  ])
}

export function createBonusTermsSchema() {
  const bonusAmountSchema = createBonusAmountSchema()

  return z
    .object({
      enabled: z.boolean(),
      speed_bonus_windows: z.array(
        z.object({
          _key: z.string().optional(),
          window_hours: z
            .number()
            .int(t`Las horas tienen que ser un número entero`)
            .min(1, t`Mínimo 1 hora`)
            .max(720, t`Máximo 720 horas`),
          bonus_amount: bonusAmountSchema,
        }),
      ),
    })
    .superRefine((bonusTerms, ctx) => {
      if (!bonusTerms.enabled) return
      if (bonusTerms.speed_bonus_windows.length > 0) return

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t`Agregá al menos una ventana de bono`,
        path: ['speed_bonus_windows'],
      })
    })
}

export function createCreateOfferSchema() {
  const bonusTermsSchema = createBonusTermsSchema()

  return z
    .object({
      campaign_id: z.uuid(),
      creator_account_id: z.uuid(),
      offer_mode: z.enum(['same_content', 'per_platform']),
      amount: z.number().positive(t`El monto tiene que ser mayor a 0`),
      tentative_publish_date: z
        .string()
        .regex(dateOnlyRegex, t`Usá el formato AAAA-MM-DD`),
      offer_deadline: z
        .string()
        .regex(dateOnlyRegex, t`Usá el formato AAAA-MM-DD`),
      platforms: z
        .array(z.enum(OFFER_PLATFORMS))
        .min(1, t`Seleccioná al menos una plataforma`),
      bonus_terms: bonusTermsSchema.optional(),
    })
    .superRefine((offer, ctx) => {
      if (offer.tentative_publish_date < getMinimumTentativePublishDateUTC()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`La fecha tentativa de publicación tiene que ser al menos dentro de cuatro días`,
          path: ['tentative_publish_date'],
        })
      }

      if (offer.offer_deadline < offer.tentative_publish_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`La fecha límite tiene que ser igual o posterior a la publicación tentativa`,
          path: ['offer_deadline'],
        })
      }

      if (new Set(offer.platforms).size !== offer.platforms.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`Las plataformas no pueden repetirse`,
          path: ['platforms'],
        })
      }

      if (offer.offer_mode !== 'per_platform' || !offer.bonus_terms?.enabled)
        return

      if (offer.bonus_terms.speed_bonus_windows.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t`Los bonos sólo están disponibles para un contenido único`,
          path: ['bonus_terms', 'speed_bonus_windows'],
        })
      }
    })
}

export type CreateOfferFormValues = z.infer<
  ReturnType<typeof createCreateOfferSchema>
>
export type OfferBonusTermsFormValues = z.infer<
  ReturnType<typeof createBonusTermsSchema>
>
export type OfferBonusWindowFormValues =
  OfferBonusTermsFormValues['speed_bonus_windows'][number]
