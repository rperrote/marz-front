import { Check } from 'lucide-react'
import { cn } from '#/lib/utils'

interface OnboardingOptionChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  role?: 'radio' | 'checkbox'
  'aria-checked'?: boolean
  className?: string
}

export function OnboardingOptionChip(props: OnboardingOptionChipProps) {
  const {
    label,
    selected,
    onToggle,
    role = 'checkbox',
    className,
    'aria-checked': ariaChecked = selected,
  } = props

  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-5 text-[length:var(--font-size-sm)] font-medium transition-colors',
        selected
          ? 'border-[1.5px] border-primary bg-primary/[0.125] font-semibold text-primary'
          : 'border border-border bg-card text-foreground hover:bg-surface-hover',
        className,
      )}
    >
      {selected && <Check className="size-3.5" />}
      {label}
    </button>
  )
}
