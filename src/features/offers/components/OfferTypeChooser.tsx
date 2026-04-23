import { cn } from '#/lib/utils'

export type OfferType = 'single' | 'bundle' | 'multistage'

interface OfferTypeChooserProps {
  value: OfferType
  onChange?: (value: OfferType) => void
}

const options: Array<{ value: OfferType; label: string }> = [
  { value: 'single', label: 'Single' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'multistage', label: 'Multi-Stage' },
]

export function OfferTypeChooser({ value, onChange }: OfferTypeChooserProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Offer type"
      className="grid grid-cols-3 gap-2"
    >
      {options.map((option) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange?.(option.value)}
            className={cn(
              'flex items-center justify-center gap-3 rounded-full border-2 px-4 py-3 text-sm font-semibold transition-colors',
              checked
                ? 'border-primary bg-muted text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-surface-hover',
            )}
          >
            <span
              className={cn(
                'flex size-4 items-center justify-center rounded-full border-2',
                checked ? 'border-primary' : 'border-border',
              )}
            >
              {checked ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : null}
            </span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
