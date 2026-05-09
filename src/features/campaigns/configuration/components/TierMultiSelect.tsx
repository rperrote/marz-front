import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { FieldRow } from '#/shared/ui/form'
import { cn } from '#/lib/utils'
import type { OperationalTargetingValues } from '../schemas'

type CreatorTier = OperationalTargetingValues['tiers'][number]

export const CREATOR_TIER_OPTIONS: Array<{
  value: CreatorTier
  label: () => string
}> = [
  { value: 'emergent', label: () => t`Emergente` },
  { value: 'growing', label: () => t`En crecimiento` },
  { value: 'consolidated', label: () => t`Consolidado` },
  { value: 'reference', label: () => t`Referente` },
  { value: 'massive', label: () => t`Masivo` },
  { value: 'celebrity', label: () => t`Celebridad` },
]

interface TierMultiSelectProps {
  value: CreatorTier[]
  onChange: (value: CreatorTier[]) => void
  label: string
  error?: string
}

export function TierMultiSelect({
  value,
  onChange,
  label,
  error,
}: TierMultiSelectProps) {
  const selected = new Set(value)

  const toggleTier = (tier: CreatorTier) => {
    onChange(
      selected.has(tier)
        ? value.filter((item) => item !== tier)
        : [...value, tier],
    )
  }

  return (
    <FieldRow label={label} error={error}>
      {(aria) => (
        <div className="flex flex-wrap gap-2" role="group" {...aria}>
          {CREATOR_TIER_OPTIONS.map((option) => {
            const isSelected = selected.has(option.value)
            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'rounded-full',
                  isSelected && 'text-primary-foreground',
                )}
                onClick={() => toggleTier(option.value)}
                aria-pressed={isSelected}
              >
                {option.label()}
              </Button>
            )
          })}
        </div>
      )}
    </FieldRow>
  )
}
