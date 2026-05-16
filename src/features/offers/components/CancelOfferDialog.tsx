import { useMemo, useState } from 'react'
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
import type { OfferDetailDTO } from '#/features/offers/hooks/useConversationOffers'
import { ApiError } from '#/shared/api/mutator'

import { useCancelOfferMutation } from '../hooks/useCancelOfferMutation'

export type CancelOfferDetail = OfferDetailDTO & {
  offer_deadline?: string | null
}

interface CancelOfferDialogProps {
  offer: CancelOfferDetail
  conversationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled?: () => void
  todayUtcDateString?: string
}

export function getTodayUtcDateString() {
  return new Date().toISOString().slice(0, 10)
}

function getConflictMessage(error: ApiError) {
  if (error.code === 'offer_not_cancellable_deadline_pending') {
    return t`Todavía no pasó el offer deadline.`
  }

  if (error.code === 'offer_not_cancellable_live_links') {
    return t`Hay links publicados activos para esta oferta.`
  }

  return t`No se puede cancelar esta oferta en este estado.`
}

function getOfferDeadline(offer: CancelOfferDetail) {
  return offer.offer_deadline
}

function canCancelAcceptedOffer(
  offer: CancelOfferDetail,
  todayUtcDateString: string,
) {
  const deadline = getOfferDeadline(offer)
  if (!deadline) return false

  return deadline.slice(0, 10) < todayUtcDateString
}

export function CancelOfferDialog({
  offer,
  conversationId,
  open,
  onOpenChange,
  onCancelled,
  todayUtcDateString = getTodayUtcDateString(),
}: CancelOfferDialogProps) {
  const [inlineError, setInlineError] = useState<string | null>(null)
  const cancelOffer = useCancelOfferMutation()
  const isAccepted = offer.status === 'accepted'
  const title = isAccepted ? t`Cancelar oferta aceptada` : t`Cancelar oferta`
  const description = isAccepted
    ? t`Esta acción cancela una oferta ya aceptada. El backend valida si todavía hay deadlines o links activos.`
    : t`Esta acción cancela la oferta enviada.`
  const canSubmit =
    !isAccepted || canCancelAcceptedOffer(offer, todayUtcDateString)

  const disabledReason = useMemo(() => {
    if (!isAccepted || canSubmit) return null
    return t`Todavía no pasó el offer deadline.`
  }, [canSubmit, isAccepted])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setInlineError(null)
      cancelOffer.reset()
    }
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    setInlineError(null)
    cancelOffer.mutate(
      { offerId: offer.id, conversationId },
      {
        onSuccess: () => {
          onCancelled?.()
          handleOpenChange(false)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setInlineError(getConflictMessage(error))
            return
          }

          setInlineError(t`Algo salió mal. Intentá de nuevo.`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {(inlineError ?? disabledReason) ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {inlineError ?? disabledReason}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t`Volver`}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || cancelOffer.isPending}
            onClick={handleConfirm}
          >
            {cancelOffer.isPending ? t`Cancelando…` : title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
