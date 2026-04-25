import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { ProcessingStepStatus } from '../hooks/useBriefBuilderWS'

interface BriefProcessingStepProps {
  label: string
  stepNumber: number
  status: ProcessingStepStatus
  errorMessage?: string
}

const STATUS_ICON: Record<ProcessingStepStatus, React.ReactNode> = {
  pending: null,
  active: (
    <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
  ),
  completed: <Check className="size-5 text-success" aria-hidden="true" />,
  failed: <X className="size-5 text-destructive" aria-hidden="true" />,
}

const STATUS_TEXT_CLASS: Record<ProcessingStepStatus, string> = {
  pending: 'text-muted-foreground',
  active: 'text-foreground font-medium',
  completed: 'text-foreground',
  failed: 'text-destructive',
}

export function BriefProcessingStep({
  label,
  stepNumber,
  status,
  errorMessage,
}: BriefProcessingStepProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            status === 'pending' && 'bg-muted text-muted-foreground',
            status === 'active' && 'bg-primary/10',
            status === 'completed' && 'bg-success/10',
            status === 'failed' && 'bg-destructive/10',
          )}
        >
          {status === 'pending' ? (
            <span className="text-sm">{stepNumber}</span>
          ) : (
            STATUS_ICON[status]
          )}
        </div>
        <span className={cn('text-sm', STATUS_TEXT_CLASS[status])}>
          {label}
        </span>
      </div>
      {status === 'failed' && errorMessage && (
        <p className="ml-11 text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}
