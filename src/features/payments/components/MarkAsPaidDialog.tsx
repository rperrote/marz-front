import { useState } from 'react'
import type { FormEvent } from 'react'
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
import { Input } from '#/components/ui/input'
import { ApiError } from '#/shared/api/mutator'
import type { MarkAsPaidOffer } from '#/shared/payments/markAsPaidEligibility'

import { useMarkOfferPaidMutation } from '../hooks/useMarkOfferPaidMutation'

interface MarkAsPaidDialogProps {
  offer: MarkAsPaidOffer
  conversationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid?: () => void
}

function getConflictMessage(error: ApiError) {
  if (error.code === 'offer_already_paid') {
    return t`Esta oferta ya fue marcada como pagada.`
  }

  if (error.code === 'offer_not_mark_paid_eligible') {
    return t`Esta oferta todavía no está lista para marcar como pagada.`
  }

  return t`No se puede marcar esta oferta como pagada.`
}

export function MarkAsPaidDialog({
  offer,
  conversationId,
  open,
  onOpenChange,
  onPaid,
}: MarkAsPaidDialogProps) {
  const [amount, setAmount] = useState(offer.amount)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const markOfferPaid = useMarkOfferPaidMutation()
  const numericAmount = Number(amount.trim())
  const amountIsValid = Number.isFinite(numericAmount) && numericAmount > 0

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setInlineError(null)
      markOfferPaid.reset()
    } else {
      setAmount(offer.amount)
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInlineError(null)

    if (!amountIsValid) {
      setInlineError(t`Ingresá un monto mayor a 0.`)
      return
    }

    markOfferPaid.mutate(
      {
        offerId: offer.id,
        conversationId,
        amount: amount.trim(),
      },
      {
        onSuccess: () => {
          onPaid?.()
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
          <DialogTitle>{t`Marcar como pagado`}</DialogTitle>
          <DialogDescription>
            {t`Confirmá el monto pagado por esta oferta.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            {t`Monto`}
            <Input
              aria-label={t`Monto pagado`}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.currentTarget.value)}
            />
          </label>

          {inlineError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inlineError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t`Cancelar`}
            </Button>
            <Button
              type="submit"
              disabled={!amountIsValid || markOfferPaid.isPending}
            >
              {markOfferPaid.isPending
                ? t`Confirmando…`
                : t`Marcar como pagado`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
