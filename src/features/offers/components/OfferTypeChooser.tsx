import { useId } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import type { OfferType } from '../store/sendOfferSheetStore'

interface Option {
  value: OfferType
  title: string
  description: string
}

interface OfferTypeChooserProps {
  value: OfferType
  onChange?: (value: OfferType) => void
}

export function OfferTypeChooser({ value, onChange }: OfferTypeChooserProps) {
  const name = useId()

  const options: Array<Option> = [
    {
      value: 'single',
      title: t`Single`,
      description: t`One deliverable, one payment`,
    },
    {
      value: 'bundle',
      title: t`Bundle`,
      description: t`Multiple deliverables in one offer`,
    },
    {
      value: 'multistage',
      title: t`Multi-stage`,
      description: t`Sequential deliverables with milestones`,
    },
  ]

  return (
    <div
      role="radiogroup"
      aria-label={t`Offer type`}
      className="grid grid-cols-3 gap-3"
    >
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              'block cursor-pointer rounded-xl border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-ring',
              checked
                ? 'border-primary bg-muted'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange?.(option.value)}
              className="sr-only"
            />
            <div className="text-base font-semibold text-foreground">
              {option.title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {option.description}
            </div>
          </label>
        )
      })}
    </div>
  )
}
