import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

interface OnboardingVerticalCardProps {
  label: string
  icon: LucideIcon
  selected: boolean
  onToggle: () => void
  role?: 'radio' | 'checkbox'
  className?: string
}

export function OnboardingVerticalCard({
  label,
  icon: Icon,
  selected,
  onToggle,
  role = 'radio',
  className,
}: OnboardingVerticalCardProps) {
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
        'flex h-[140px] w-[180px] flex-col justify-between rounded-xl p-5 text-left transition-colors',
        selected
          ? 'border-2 border-primary bg-muted'
          : 'border border-border bg-card hover:bg-surface-hover',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-lg',
          selected ? 'bg-primary' : 'bg-muted',
        )}
      >
        <Icon
          className={cn(
            'size-5',
            selected ? 'text-primary-foreground' : 'text-foreground',
          )}
        />
      </div>
      <span className="text-[length:var(--font-size-md)] font-semibold text-foreground">
        {label}
      </span>
    </button>
  )
}
