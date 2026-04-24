import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

interface OnboardingTierCardProps {
  label: string
  description: string
  icon: LucideIcon
  selected: boolean
  onToggle: () => void
  role?: 'radio' | 'checkbox'
  className?: string
}

export function OnboardingTierCard({
  label,
  description,
  icon: Icon,
  selected,
  onToggle,
  role = 'radio',
  className,
}: OnboardingTierCardProps) {
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
        'flex h-[150px] w-[220px] flex-col justify-between rounded-xl p-5 text-left transition-colors',
        selected
          ? 'border-2 border-primary bg-primary/[0.08]'
          : 'border border-border bg-card hover:bg-surface-hover',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
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
      <div className="flex flex-col gap-1">
        <span className="text-[length:var(--font-size-md)] font-semibold text-foreground">
          {label}
        </span>
        <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
          {description}
        </span>
      </div>
    </button>
  )
}
