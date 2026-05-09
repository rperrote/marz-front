import { CompleteCreatorOnboardingBody } from '#/shared/api/generated/zod/onboarding/onboarding'
import type { RefinementCtx } from 'zod'
import type { CreatorOnboardingPayload } from '#/shared/api/generated/model/creatorOnboardingPayload'

type CreatorChannel = CreatorOnboardingPayload['channels'][number]
type CreatorRateCard = CreatorChannel['rate_cards'][number]

const FORMATS_BY_PLATFORM: Record<string, readonly string[]> = {
  instagram: ['ig_reel', 'ig_story', 'ig_post'],
  tiktok: ['tiktok_post'],
  youtube: ['yt_short', 'yt_long', 'yt_podcast'],
}

export const creatorChannelsRefinement = (
  channels: CreatorOnboardingPayload['channels'],
  ctx: RefinementCtx,
) => {
  if (channels.length < 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['channels'],
      message: 'at_least_one_channel_required',
    })
    return
  }
  const primaries = channels.filter((c: CreatorChannel) => c.is_primary).length
  if (primaries !== 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['channels'],
      message: 'exactly_one_primary_required',
    })
  }
  channels.forEach((channel: CreatorChannel, i: number) => {
    const allowed = FORMATS_BY_PLATFORM[channel.platform]
    const seenFormats = new Set<string>()
    channel.rate_cards.forEach((rc: CreatorRateCard, j: number) => {
      if (allowed && !allowed.includes(rc.format)) {
        ctx.addIssue({
          code: 'custom',
          path: ['channels', i, 'rate_cards', j, 'format'],
          message: 'format_not_valid_for_platform',
        })
      }
      if (seenFormats.has(rc.format)) {
        ctx.addIssue({
          code: 'custom',
          path: ['channels', i, 'rate_cards', j, 'format'],
          message: 'duplicate_format_in_channel',
        })
      }
      seenFormats.add(rc.format)
    })
  })
}

export function validateChannels(
  channels: CreatorOnboardingPayload['channels'],
): string[] {
  const errors: string[] = []
  if (channels.length < 1) {
    errors.push('at_least_one_channel_required')
    return errors
  }
  const primaries = channels.filter((c: CreatorChannel) => c.is_primary).length
  if (primaries !== 1) {
    errors.push('exactly_one_primary_required')
  }
  channels.forEach((channel: CreatorChannel) => {
    const allowed = FORMATS_BY_PLATFORM[channel.platform]
    const seenFormats = new Set<string>()
    channel.rate_cards.forEach((rc: CreatorRateCard) => {
      if (allowed && !allowed.includes(rc.format)) {
        errors.push('format_not_valid_for_platform')
      }
      if (seenFormats.has(rc.format)) {
        errors.push('duplicate_format_in_channel')
      }
      seenFormats.add(rc.format)
    })
  })
  return errors
}

export const CreatorOnboardingPayloadSchema =
  CompleteCreatorOnboardingBody.superRefine(
    (val: CreatorOnboardingPayload, ctx: RefinementCtx) => {
      creatorChannelsRefinement(val.channels, ctx)
      if (val.niches.length < 1 || val.niches.length > 5) {
        ctx.addIssue({
          code: 'custom',
          path: ['niches'],
          message: 'niches_count_out_of_range',
        })
      }
    },
  )
