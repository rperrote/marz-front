import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

interface MarkAsPaidConfirmDialogProps {
  open: boolean
  amountLabel: string
  creatorName: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function MarkAsPaidConfirmDialog({
  open,
  amountLabel,
  creatorName,
  isSubmitting,
  onCancel,
  onConfirm,
}: MarkAsPaidConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t`Confirm payment`}</DialogTitle>
          <DialogDescription>
            {t`¿Confirmás que ya pagaste ${amountLabel} de la marca a ${creatorName}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t`Cancel`}
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t`Confirm`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
