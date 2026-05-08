import { t } from '@lingui/core/macro'
import { useEffect, useMemo, useRef } from 'react'

import type { MessageItem } from '#/features/chat/types'
import { trackCardSeen } from '#/shared/analytics/paymentCardSeen'
import { i18n } from '#/shared/i18n/setup'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { PaymentCard } from '#/shared/ui/PaymentCard'
import type { PaymentMarkedSnapshot } from '#/shared/ws/types'

interface PaymentMarkedCardProps {
  message: MessageItem
  viewer: { kind: 'brand' | 'creator' | undefined }
}

type PaymentMarkedCardSnapshot = PaymentMarkedSnapshot & {
  declared_payment_id?: string
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): PaymentMarkedCardSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (snapshot.event_type !== 'PaymentMarked') return null
  if (typeof snapshot.amount !== 'string') return null
  if (typeof snapshot.currency !== 'string') return null
  if (typeof snapshot.deliverable_display_label !== 'string') return null
  if (typeof snapshot.declared_at !== 'string') return null
  if (typeof snapshot.deliverable_id !== 'string') return null
  return snapshot as unknown as PaymentMarkedSnapshot
}

function buildNote(snapshot: PaymentMarkedSnapshot) {
  const declaredDate = new Date(snapshot.declared_at).toLocaleDateString(
    i18n.locale || undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
  return t`${snapshot.deliverable_display_label} · ${declaredDate}`
}

export function PaymentMarkedCard({ message, viewer }: PaymentMarkedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (
      !snapshot?.declared_payment_id ||
      viewer.kind !== 'creator' ||
      hasFiredRef.current ||
      !cardRef.current
    ) {
      return
    }

    const declaredPaymentId = snapshot.declared_payment_id

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting)
      if (!isVisible || hasFiredRef.current) return

      hasFiredRef.current = true
      trackCardSeen({ declared_payment_id: declaredPaymentId })
      observer.disconnect()
    })

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [snapshot, viewer.kind])

  if (!snapshot) return null

  const audience = viewer.kind === 'brand' ? 'sent' : 'received'

  return (
    <div
      ref={cardRef}
      className={`flex py-1 ${viewer.kind === 'brand' ? 'justify-end' : 'justify-start'}`}
      data-testid="payment-marked-card"
    >
      <div className="w-full max-w-[380px]">
        <PaymentCard
          audience={audience}
          amount={formatOfferAmount(snapshot.amount, snapshot.currency)}
          note={buildNote(snapshot)}
        />
      </div>
    </div>
  )
}
