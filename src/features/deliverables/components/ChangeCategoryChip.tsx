import { cn } from '#/lib/utils'

export interface ChangeCategoryChipProps {
  label: string
  selected: boolean
  onToggle: () => void
}

export function ChangeCategoryChip({
  label,
  selected,
  onToggle,
}: ChangeCategoryChipProps) {
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
