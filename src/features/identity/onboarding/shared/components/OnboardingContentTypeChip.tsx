import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

interface OnboardingContentTypeChipProps {
  label: string
  icon: LucideIcon
  selected: boolean
  onToggle: () => void
  role?: 'radio' | 'checkbox'
  className?: string
}

export function OnboardingContentTypeChip({
  label,
  icon: Icon,
  selected,
  onToggle,
  role = 'checkbox',
  className,
}: OnboardingContentTypeChipProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'inline-flex h-14 w-[178px] items-center gap-2.5 rounded-2xl px-4 text-[length:var(--font-size-sm)] font-medium transition-colors',
        selected
          ? 'border-2 border-primary bg-primary/[0.08] font-semibold'
          : 'border border-border bg-card hover:bg-surface-hover',
        className,
      )}
    >
      <Icon
        className={cn('size-4', selected ? 'text-primary' : 'text-foreground')}
      />
      <span className="text-foreground">{label}</span>
    </button>
  )
}
