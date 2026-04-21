import { Plus, X as XIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { IconButton } from '#/shared/ui/IconButton'
import { DeadlineField } from './DeadlineField'

interface StageEditorProps {
  stageNumber: number
  name: string
  onChangeName?: (value: string) => void
  deadline: string
  onChangeDeadline?: (value: string) => void
  subtotal: string | null
  onRemove?: () => void
  onAddDeliverable?: () => void
  children?: ReactNode
}

export function StageEditor({
  stageNumber,
  name,
  onChangeName,
  deadline,
  onChangeDeadline,
  subtotal,
  onRemove,
  onAddDeliverable,
  children,
}: StageEditorProps) {
  return (
    <section className="space-y-3 rounded-xl bg-muted p-4">
      <header className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Stage {stageNumber}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName?.(e.target.value)}
            placeholder="Stage name"
            className="mt-0.5 w-full border-0 bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="w-40">
          <DeadlineField value={deadline} onChange={onChangeDeadline} />
        </div>
        <IconButton size="sm" aria-label="Remove stage" onClick={onRemove}>
          <XIcon />
        </IconButton>
      </header>

      <div className="space-y-2">{children}</div>

      <button
        type="button"
        onClick={onAddDeliverable}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
      >
        <Plus className="size-4" />
        Add deliverable
      </button>

      <div className="flex items-baseline justify-between border-t border-border pt-2 text-sm">
        <span className="text-muted-foreground">Stage subtotal</span>
        <span className="font-mono font-semibold text-foreground">
          {subtotal ?? '—'}
        </span>
      </div>
    </section>
  )
}
