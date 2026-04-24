import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface OnboardingFooterProps {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  autosaveLabel?: string
  isLoading?: boolean
  className?: string
}

export function OnboardingFooter({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  autosaveLabel = 'Autoguardado',
  isLoading = false,
  className,
}: OnboardingFooterProps) {
  return (
    <footer
      className={cn(
        'flex h-20 w-full items-center justify-between border-t border-border bg-background px-8',
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[length:var(--font-size-sm)] font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
          {autosaveLabel}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || isLoading}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[length:var(--font-size-sm)] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </footer>
  )
}
