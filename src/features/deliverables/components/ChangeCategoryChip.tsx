import { cn } from '#/lib/utils'

export interface ChangeCategoryChipProps {
  label: string
  selected: boolean
  onToggle?: () => void
  readOnly?: boolean
}

export function ChangeCategoryChip({
  label,
  selected,
  onToggle,
  readOnly = false,
}: ChangeCategoryChipProps) {
  if (readOnly) {
    return (
      <span
        className={cn(
          'rounded-full border px-4 py-1.5 text-sm',
          selected
            ? 'border-primary/60 bg-primary/15 text-primary'
            : 'border-border/60 bg-muted/50 text-muted-foreground',
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}
