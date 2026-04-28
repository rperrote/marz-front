import { t } from '@lingui/core/macro'
import type { OfferStatus } from '../types'

export function getStatusConfig(status: OfferStatus): {
  label: string
  className: string
} {
  const configs: Record<OfferStatus, { label: string; className: string }> = {
    sent: {
      label: t`Sent`,
      className: 'bg-primary text-primary-foreground',
    },
    accepted: {
      label: t`Accepted`,
      className: 'bg-success text-success-foreground',
    },
    rejected: {
      label: t`Rejected`,
      className: 'bg-destructive text-destructive-foreground',
    },
    expired: {
      label: t`Expired`,
      className: 'text-muted-foreground border border-border',
    },
  }
  return configs[status]
}
