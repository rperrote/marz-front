import { t } from '@lingui/core/macro'
import { Clock } from 'lucide-react'

import { useClientNow } from '#/shared/hooks/useClientNow'
import type { OfferDetailDTO } from '#/features/offers/types'

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

interface OfferCountdownProps {
  expiresAt: OfferDetailDTO['expires_at']
  status: OfferDetailDTO['status']
}

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / SECOND_MS))
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60
  const secondsLabel = seconds.toString().padStart(2, '0')

  if (remainingMs >= DAY_MS) return t`${days}d ${hours}h`
  if (remainingMs >= HOUR_MS) return t`${hours}h ${minutes}m`
  return t`${minutes}m ${secondsLabel}s`
}

export function OfferCountdown({ expiresAt, status }: OfferCountdownProps) {
  const now = useClientNow(1000)

  if (status !== 'sent') return null

  const renderBadge = (content: React.ReactNode) => (
    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
      <Clock className="size-3.5" aria-hidden="true" />
      <span>{content}</span>
    </div>
  )

  if (now === null) {
    return renderBadge(t`Calculando tiempo restante...`)
  }

  const remainingMs = Date.parse(expiresAt) - now

  if (Number.isNaN(remainingMs) || remainingMs <= 0) {
    return renderBadge(t`La oferta está expirando...`)
  }

  return renderBadge(
    t`La oferta vence en ${formatRemainingTime(remainingMs)}`,
  )
}
