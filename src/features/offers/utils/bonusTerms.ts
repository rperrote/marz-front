import type { OfferBonusTerms } from '#/shared/api/generated/model'

function sortBonusTerms(bonusTerms: OfferBonusTerms): OfferBonusTerms {
  return {
    speed_bonus_windows: bonusTerms.speed_bonus_windows
      .toSorted((a, b) => a.window_hours - b.window_hours)
      .map(({ window_hours, bonus_amount }) => ({
        window_hours,
        bonus_amount,
      })),
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
    .map((window) => {
      const label =
        window.bonus_amount.type === 'percentage'
          ? `+${window.bonus_amount.value}%`
          : `+$${window.bonus_amount.amount}`
      return `${label} / ${window.window_hours}h`
    })
    .join(' · ')
}
