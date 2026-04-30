import { X as XIcon } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { IconButton } from '#/shared/ui/IconButton'

interface StageEditorProps {
  stageNumber: number
  name: string
  description: string
  deadline: string
  amount: string
  onChangeName: (value: string) => void
  onChangeDescription: (value: string) => void
  onChangeDeadline: (value: string) => void
  onChangeAmount: (value: string) => void
  onRemove?: () => void
  deadlineError?: string
}

export function StageEditor({
  stageNumber,
  name,
  description,
  deadline,
  amount,
  onChangeName,
  onChangeDescription,
  onChangeDeadline,
  onChangeAmount,
  onRemove,
  deadlineError,
}: StageEditorProps) {
  const deadlineErrorId = `stage-${stageNumber}-deadline-error`

  return (
    <div
      className={`space-y-3 rounded-xl bg-muted p-4 ${deadlineError ? 'border border-destructive' : ''}`}
      role="group"
      aria-label={`Stage ${stageNumber}`}
    >
      <header className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Stage {stageNumber}
          </div>
          <Input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Stage name"
            className="mt-0.5 border-0 bg-transparent text-base font-semibold text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            aria-label="Stage name"
          />
        </div>
        {onRemove ? (
          <IconButton size="sm" aria-label="Remove stage" onClick={onRemove}>
            <XIcon />
          </IconButton>
        ) : null}
      </header>

      <div>
        <label
          htmlFor={`stage-${stageNumber}-description`}
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <Textarea
          id={`stage-${stageNumber}-description`}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Describe what this stage covers"
          className="min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`stage-${stageNumber}-deadline`}
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Deadline
          </label>
          <Input
            id={`stage-${stageNumber}-deadline`}
            type="date"
            value={deadline}
            onChange={(e) => onChangeDeadline(e.target.value)}
            className={deadlineError ? 'border-destructive' : ''}
            aria-invalid={deadlineError ? true : undefined}
            aria-describedby={
              deadlineError ? `stage-${stageNumber}-deadline-error` : undefined
            }
          />
          {deadlineError ? (
            <p
              id={deadlineErrorId}
              className="mt-1 text-sm text-destructive"
              aria-live="polite"
            >
              {deadlineError}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`stage-${stageNumber}-amount`}
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Amount
          </label>
          <Input
            id={`stage-${stageNumber}-amount`}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onChangeAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  )
}
