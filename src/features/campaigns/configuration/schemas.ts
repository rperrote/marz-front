import { z } from 'zod'

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
    countries: z.array(z.string().length(2)).default([]),
    tiers: z.array(CampaignCreatorTierSchema).default([]),
    follower_min: z.number().int().min(0).nullable(),
    follower_max: z.number().int().min(0).nullable(),
    genders: z.array(z.string()).default([]),
    age_min: z.number().int().min(18).max(120).nullable(),
    age_max: z.number().int().min(18).max(120).nullable(),
    interests: z.array(z.string()).default([]),
    content_languages: z
      .array(z.string().regex(/^[a-z]{2,3}(-[a-z0-9]+)*$/))
      .default([]),
    source: z.enum(['brief_prefill', 'manual']).default('manual'),
    adjusted_from_brief: z.boolean().default(false),
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

const BonusPercentageSchema = z.number().int().min(1).max(100)
const BonusWindowHoursSchema = z.number().int().min(1).max(720)

const SpeedBonusWindowSchema = z.object({
  window_id: z.string().uuid().optional(),
  window_hours: BonusWindowHoursSchema,
  bonus_pct: BonusPercentageSchema,
})

const PerformanceBonusMilestoneSchema = z.object({
  milestone_id: z.string().uuid().optional(),
  views: z.number().int().positive(),
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
