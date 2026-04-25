import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface WizardFooterProps {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  isLoading?: boolean
  className?: string
}

export function WizardFooter({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  isLoading = false,
  className,
}: WizardFooterProps) {
  return (
    <div
      className={cn('flex w-full items-center justify-center gap-3', className)}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isLoading}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  )
}
