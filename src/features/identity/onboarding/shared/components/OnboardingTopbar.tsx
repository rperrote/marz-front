import { cn } from '#/lib/utils'

interface OnboardingTopbarProps {
  stepLabel: string
  onExit?: () => void
  exitLabel?: string
  brandLabel?: string
  className?: string
}

export function OnboardingTopbar({
  stepLabel,
  onExit,
  exitLabel = 'Salir',
  brandLabel = 'Marz',
  className,
}: OnboardingTopbarProps) {
  return (
    <header
      className={cn(
        'flex h-16 w-full items-center justify-between bg-background px-8',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-sm bg-foreground">
          <svg
            width="16"
            height="16"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7.75" cy="8.75" r="1.75" fill="var(--background)" />
            <circle cx="14" cy="8.75" r="1.75" fill="var(--background)" />
            <circle cx="20.25" cy="8.75" r="1.75" fill="var(--background)" />
            <circle cx="7.75" cy="19.25" r="1.75" fill="var(--background)" />
            <circle cx="14" cy="19.25" r="1.75" fill="var(--background)" />
            <circle cx="20.25" cy="19.25" r="1.75" fill="var(--background)" />
            <rect
              x="7.25"
              y="10.5"
              width="1"
              height="7"
              fill="var(--background)"
            />
            <rect
              x="13.5"
              y="10.5"
              width="1"
              height="7"
              fill="var(--background)"
            />
            <rect
              x="19.75"
              y="10.5"
              width="1"
              height="7"
              fill="var(--background)"
            />
          </svg>
        </div>
        <span className="text-base font-bold text-foreground">
          {brandLabel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground">
          {stepLabel}
        </span>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="flex h-8 items-center rounded-full border border-border bg-card px-3 text-[length:var(--font-size-xs)] font-medium text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            {exitLabel}
          </button>
        )}
      </div>
    </header>
  )
}
