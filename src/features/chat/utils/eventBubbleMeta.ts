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
      return { label: t`Offer sent`, severity: 'info', icon: Send }
    case 'OfferAccepted':
    case 'offer_accepted':
      return { label: t`Offer accepted`, severity: 'success', icon: Check }
    case 'OfferRejected':
    case 'offer_rejected':
      return {
        label: t`Offer rejected`,
        severity: 'destructive',
        icon: CircleX,
      }
    case 'OfferExpired':
    case 'offer_expired':
      return { label: t`Offer expired`, severity: 'warning', icon: Hourglass }
    case 'DraftSubmitted':
      return {
        label: t`Draft submitted — awaiting review`,
        severity: 'info',
        icon: Upload,
      }
    case 'DraftApproved':
      return { label: t`Draft approved`, severity: 'success', icon: Check }
    case 'ChangesRequested':
      return {
        label: t`Changes requested`,
        severity: 'warning',
        icon: Hourglass,
      }
    case 'LinkSubmitted':
      return {
        label: t`Link submitted — awaiting review`,
        severity: 'info',
        icon: LinkIcon,
      }
    case 'LinkApproved':
      return { label: t`Link approved`, severity: 'success', icon: Check }
    case 'LinkChangesRequested':
      return {
        label: t`Link changes requested`,
        severity: 'warning',
        icon: Hourglass,
      }
    case 'PaymentMarked':
      return {
        label: t`Payment marked as paid`,
        severity: 'success',
        icon: Wallet,
      }
    default:
      return null
  }
}
