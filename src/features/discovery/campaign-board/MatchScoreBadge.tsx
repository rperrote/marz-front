import { t } from '@lingui/core/macro'
import { Sparkles } from 'lucide-react'

import { cn } from '#/lib/utils'

export type MatchScoreBand = 'high' | 'medium' | 'low'

interface MatchScoreBadgeProps {
  score: number
  className?: string
}

export function getMatchScoreBand(score: number): MatchScoreBand {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

const bandClassName: Record<MatchScoreBand, string> = {
  high: 'border-success/25 bg-success/10 text-success',
  medium: 'border-warning/25 bg-warning/10 text-warning',
  low: 'border-muted-foreground/25 bg-muted text-muted-foreground',
}

const bandLabel: Record<MatchScoreBand, string> = {
  high: t`match alto`,
  medium: t`match medio`,
  low: t`match bajo`,
}

export function MatchScoreBadge({ score, className }: MatchScoreBadgeProps) {
  const roundedScore = Math.round(score)
  const band = getMatchScoreBand(score)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
        bandClassName[band],
        className,
      )}
      aria-label={t`${roundedScore}% de match, ${bandLabel[band]}`}
    >
      <Sparkles className="size-3" aria-hidden="true" />
      {roundedScore}%
    </span>
  )
}
