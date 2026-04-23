import { Play, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { IconButton } from '#/shared/ui/IconButton'
import { cn } from '#/lib/utils'

interface RequestChangesModalProps {
  title: string
  triggerLabel?: string
  reasonOptions?: Array<string>
  onSubmit?: (payload: { reasons: Array<string>; notes: string }) => void
  /** Render inline (for /ds showcase) vs. as a dialog. */
  inline?: boolean
}

const defaultReasons = ['Product placement', 'Pacing', 'Audio', 'Discount code']

export function RequestChangesModal({
  title,
  triggerLabel = 'Request changes',
  reasonOptions = defaultReasons,
  onSubmit,
  inline = false,
}: RequestChangesModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')

  function toggle(reason: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(reason)) next.delete(reason)
      else next.add(reason)
      return next
    })
  }

  const body = (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Request changes
          </p>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {!inline ? (
          <IconButton aria-label="Close" shape="circle">
            <X />
          </IconButton>
        ) : null}
      </header>

      <div className="aspect-video w-full rounded-lg bg-muted">
        <div className="flex h-full items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-foreground/70 text-background">
            <Play className="size-7" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">
          What needs to change?
        </Label>
        <div className="flex flex-wrap gap-2">
          {reasonOptions.map((reason) => {
            const isActive = selected.has(reason)
            return (
              <button
                key={reason}
                type="button"
                onClick={() => toggle(reason)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:bg-surface-hover',
                )}
              >
                {reason}
              </button>
            )
          })}
          <button
            type="button"
            className="rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            + Other
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="rc-notes"
          className="text-sm font-semibold text-foreground"
        >
          Additional notes
        </Label>
        <Textarea
          id="rc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Be specific — mention timestamps if possible (e.g. 'at 0:42 the product logo is cropped')"
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() => onSubmit?.({ reasons: Array.from(selected), notes })}
        >
          Send feedback
        </Button>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6">
        <DialogTitleShim>{title}</DialogTitleShim>
        {body}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  )
}

/** Inline variant has its own header — this keeps a11y title accessible. */
function DialogTitleShim({ children }: { children: string }) {
  return <h2 className="sr-only">{children}</h2>
}
