import { t } from '@lingui/core/macro'

export function resolveEventDirection(args: {
  eventType: string | null | undefined
  authorAccountId: string | null
  currentAccountId: string
  sessionKind: 'brand' | 'creator' | undefined
}): 'in' | 'out' {
  const { eventType, authorAccountId, currentAccountId, sessionKind } = args
  if (eventType === 'OfferSent' || eventType === 'offer_sent') {
    return sessionKind === 'brand' ? 'out' : 'in'
  }
  return authorAccountId === currentAccountId ? 'out' : 'in'
}

export function EmptyMessageTimeline() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      data-testid="message-timeline"
    >
      <p className="text-sm text-muted-foreground">{t`No hay mensajes todavía`}</p>
    </div>
  )
}

export function ConversationBeginningPill() {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
        {t`Inicio de la conversación`}
      </span>
    </div>
  )
}

export function PaymentHighlightFallback() {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
        {t`Pago no visible en mensajes recientes`}
      </span>
    </div>
  )
}
