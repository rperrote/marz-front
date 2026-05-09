import { z } from 'zod'

const ISO_3166_ALPHA_2_CODES = new Set([
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AW',
  'AX',
  'AZ',
  'BA',
  'BB',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BL',
  'BM',
  'BN',
  'BO',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BV',
  'BW',
  'BY',
  'BZ',
  'CA',
  'CC',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CK',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CV',
  'CW',
  'CX',
  'CY',
  'CZ',
  'DE',
  'DJ',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'EH',
  'ER',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FK',
  'FM',
  'FO',
  'FR',
  'GA',
  'GB',
  'GD',
  'GE',
  'GF',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GP',
  'GQ',
  'GR',
  'GS',
  'GT',
  'GU',
  'GW',
  'GY',
  'HK',
  'HM',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
  'IO',
  'IQ',
  'IR',
  'IS',
  'IT',
  'JE',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KI',
  'KM',
  'KN',
  'KP',
  'KR',
  'KW',
  'KY',
  'KZ',
  'LA',
  'LB',
  'LC',
  'LI',
  'LK',
  'LR',
  'LS',
  'LT',
  'LU',
  'LV',
  'LY',
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MH',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
  'MQ',
  'MR',
  'MS',
  'MT',
  'MU',
  'MV',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NC',
  'NE',
  'NF',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NR',
  'NU',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PM',
  'PN',
  'PR',
  'PS',
  'PT',
  'PW',
  'PY',
  'QA',
  'RE',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SB',
  'SC',
  'SD',
  'SE',
  'SG',
  'SH',
  'SI',
  'SJ',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'ST',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TF',
  'TG',
  'TH',
  'TJ',
  'TK',
  'TL',
  'TM',
  'TN',
  'TO',
  'TR',
  'TT',
  'TV',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UM',
  'US',
  'UY',
  'UZ',
  'VA',
  'VC',
  'VE',
  'VG',
  'VI',
  'VN',
  'VU',
  'WF',
  'WS',
  'YE',
  'YT',
  'ZA',
  'ZM',
  'ZW',
])

export const CampaignCreatorTierSchema = z.enum([
  'emergent',
  'growing',
  'consolidated',
  'reference',
  'massive',
  'celebrity',
])

export const OperationalTargetingSchema = z
  .object({
    countries: z.array(
      z
        .string()
        .regex(/^[A-Z]{2}$/, 'Usá códigos ISO de 2 letras en mayúsculas.')
        .refine(
          (value) => ISO_3166_ALPHA_2_CODES.has(value),
          'Ingresá un código de país ISO-3166 alpha-2 válido.',
        ),
    ),
    tiers: z.array(CampaignCreatorTierSchema),
    follower_min: z.number().int().min(0).nullable(),
    follower_max: z.number().int().min(0).nullable(),
    genders: z.array(z.string()),
    age_min: z.number().int().min(18).max(120).nullable(),
    age_max: z.number().int().min(18).max(120).nullable(),
    interests: z.array(z.string()),
    content_languages: z.array(z.string().regex(/^[a-z]{2,3}(-[a-z0-9]+)*$/)),
    source: z.enum(['brief_prefill', 'manual']),
    adjusted_from_brief: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      value.follower_min !== null &&
      value.follower_max !== null &&
      value.follower_min > value.follower_max
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['follower_max'],
        message: 'El máximo de seguidores debe ser mayor o igual al mínimo.',
      })
    }

    if (
      value.age_min !== null &&
      value.age_max !== null &&
      value.age_min > value.age_max
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['age_max'],
        message: 'La edad máxima debe ser mayor o igual a la mínima.',
      })
    }
  })

const BonusPercentageSchema = z
  .number()
  .int('Ingresá un porcentaje entero.')
  .min(1, 'El porcentaje debe ser entre 1 y 100.')
  .max(100, 'El porcentaje debe ser entre 1 y 100.')
const BonusWindowHoursSchema = z
  .number()
  .int('Ingresá una cantidad de horas entera.')
  .min(1, 'La ventana debe ser entre 1 y 720 horas.')
  .max(720, 'La ventana debe ser entre 1 y 720 horas.')

const SpeedBonusWindowSchema = z.object({
  window_id: z.string().uuid().optional(),
  window_hours: BonusWindowHoursSchema,
  bonus_pct: BonusPercentageSchema,
})

const PerformanceBonusMilestoneSchema = z.object({
  milestone_id: z.string().uuid().optional(),
  views: z
    .number()
    .int('Ingresá una cantidad de views entera.')
    .positive('Las views deben ser mayores a 0.'),
  window_hours: BonusWindowHoursSchema,
  bonus_pct: BonusPercentageSchema,
})

export const BonusConfigSchema = z
  .object({
    enabled: z.boolean(),
    speed_bonus: z.object({
      enabled: z.boolean(),
      windows: z.array(SpeedBonusWindowSchema),
    }),
    performance_bonus: z.object({
      enabled: z.boolean(),
      milestones: z.array(PerformanceBonusMilestoneSchema),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) {
      if (value.speed_bonus.enabled) {
        ctx.addIssue({
          code: 'custom',
          path: ['speed_bonus', 'enabled'],
          message: 'Desactivá Speed bonus si los bonos están apagados.',
        })
      }

      if (value.performance_bonus.enabled) {
        ctx.addIssue({
          code: 'custom',
          path: ['performance_bonus', 'enabled'],
          message: 'Desactivá Performance bonus si los bonos están apagados.',
        })
      }

      if (value.speed_bonus.windows.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['speed_bonus', 'windows'],
          message: 'Quitá las ventanas si los bonos están apagados.',
        })
      }

      if (value.performance_bonus.milestones.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['performance_bonus', 'milestones'],
          message: 'Quitá los milestones si los bonos están apagados.',
        })
      }
    }

    const seenWindowHours = new Set<number>()
    for (const [index, window] of value.speed_bonus.windows.entries()) {
      if (seenWindowHours.has(window.window_hours)) {
        ctx.addIssue({
          code: 'custom',
          path: ['speed_bonus', 'windows', index, 'window_hours'],
          message: 'No puede haber ventanas con el mismo plazo.',
        })
      }
      seenWindowHours.add(window.window_hours)

      const previousWindow = value.speed_bonus.windows[index - 1]
      if (previousWindow && previousWindow.window_hours > window.window_hours) {
        ctx.addIssue({
          code: 'custom',
          path: ['speed_bonus', 'windows', index, 'window_hours'],
          message: 'Ordená las ventanas por plazo ascendente.',
        })
      }

      if (previousWindow && previousWindow.bonus_pct < window.bonus_pct) {
        ctx.addIssue({
          code: 'custom',
          path: ['speed_bonus', 'windows', index, 'bonus_pct'],
          message: 'El porcentaje no puede subir en plazos más largos.',
        })
      }
    }

    const seenMilestoneViews = new Set<number>()
    for (const [
      index,
      milestone,
    ] of value.performance_bonus.milestones.entries()) {
      if (seenMilestoneViews.has(milestone.views)) {
        ctx.addIssue({
          code: 'custom',
          path: ['performance_bonus', 'milestones', index, 'views'],
          message: 'No puede haber milestones con la misma cantidad de views.',
        })
      }
      seenMilestoneViews.add(milestone.views)

      const previousMilestone = value.performance_bonus.milestones[index - 1]
      if (previousMilestone && previousMilestone.views > milestone.views) {
        ctx.addIssue({
          code: 'custom',
          path: ['performance_bonus', 'milestones', index, 'views'],
          message: 'Ordená los milestones por views ascendentes.',
        })
      }
    }
  })

export type OperationalTargetingValues = z.infer<
  typeof OperationalTargetingSchema
>

export type BonusConfigValues = z.infer<typeof BonusConfigSchema>
