import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'

interface RequestChangesModalFrameProps {
  children: React.ReactNode
  inline?: boolean
  title?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  triggerLabel?: string
  actionLabel?: string
  target?: 'draft' | 'link'
}

export function RequestChangesModalFrame({
  children,
  inline = false,
  title,
  open,
  onOpenChange,
  trigger,
  triggerLabel,
  actionLabel,
  target = 'draft',
}: RequestChangesModalFrameProps) {
  if (inline) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6">
        <h2 className="sr-only">{title}</h2>
        {children}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">{triggerLabel}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">{actionLabel}</DialogTitle>
        <DialogDescription className="sr-only">
          {target === 'link'
            ? t`Solicitar cambios para este link`
            : t`Solicitar cambios para este draft`}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}
