import { t } from '@lingui/core/macro'
import {
  Check,
  CircleX,
  Hourglass,
  Link as LinkIcon,
  Send,
  Upload,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { EventSeverity } from '#/shared/ui/EventBubble'

export interface EventBubbleMeta {
  label: string
  severity: EventSeverity
  icon: LucideIcon
}

// Mapping event_type → bubble meta. Centralizado para que el inline (debajo
// de cada card) y el pinned (sticky arriba del scroll) usen la misma fuente.
export function getEventBubbleMeta(
  eventType: string | null | undefined,
): EventBubbleMeta | null {
  switch (eventType) {
    case 'OfferSent':
    case 'offer_sent':
      return { label: t`Oferta enviada`, severity: 'info', icon: Send }
    case 'OfferAccepted':
    case 'offer_accepted':
      return { label: t`Oferta aceptada`, severity: 'success', icon: Check }
    case 'OfferRejected':
    case 'offer_rejected':
      return {
        label: t`Oferta rechazada`,
        severity: 'destructive',
        icon: CircleX,
      }
    case 'OfferExpired':
    case 'offer_expired':
      return { label: t`Oferta expirada`, severity: 'warning', icon: Hourglass }
    case 'DraftSubmitted':
      return {
        label: t`Draft enviado — pendiente de revisión`,
        severity: 'info',
        icon: Upload,
      }
    case 'DraftApproved':
      return { label: t`Draft aprobado`, severity: 'success', icon: Check }
    case 'ChangesRequested':
      return {
        label: t`Cambios solicitados`,
        severity: 'warning',
        icon: Hourglass,
      }
    case 'LinkSubmitted':
      return {
        label: t`Link enviado — pendiente de revisión`,
        severity: 'info',
        icon: LinkIcon,
      }
    case 'LinkApproved':
      return { label: t`Link aprobado`, severity: 'success', icon: Check }
    case 'LinkChangesRequested':
      return {
        label: t`Cambios solicitados en el link`,
        severity: 'warning',
        icon: Hourglass,
      }
    case 'PaymentMarked':
      return {
        label: t`Pago marcado como realizado`,
        severity: 'success',
        icon: Wallet,
      }
    default:
      return null
  }
}
