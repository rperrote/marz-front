import { cn } from '#/lib/utils'

interface OnboardingProgressProps {
  percent: number
  ariaLabel?: string
  className?: string
}

export function OnboardingProgress({
  percent,
  ariaLabel = 'Progreso de onboarding',
  className,
}: OnboardingProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div
      className={cn('h-0.5 w-full bg-border', className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
