import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'

interface LeaveConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LeaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: LeaveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Salir del brief builder?</DialogTitle>
          <DialogDescription>
            Vas a perder el progreso del brief. Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Seguir editando
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Salir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
