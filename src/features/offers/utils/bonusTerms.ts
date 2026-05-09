import type { OfferBonusTerms } from '#/shared/api/generated/model'

export function sortBonusTerms(bonusTerms: OfferBonusTerms): OfferBonusTerms {
  return {
    speed_bonus_windows: [...bonusTerms.speed_bonus_windows]
      .sort((a, b) => a.window_hours - b.window_hours)
      .map(({ window_hours, bonus_pct }) => ({ window_hours, bonus_pct })),
  }
}

export function formatBonusWindowsLabel(
  bonusTerms: OfferBonusTerms | null,
): string | null {
  const sortedWindows = bonusTerms
    ? sortBonusTerms(bonusTerms).speed_bonus_windows
    : []
  if (sortedWindows.length === 0) return null
  return sortedWindows
    .map((window) => `+${window.bonus_pct}% / ${window.window_hours}h`)
    .join(' · ')
}
