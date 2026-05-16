import { t } from '@lingui/core/macro'
import { useEffect, useMemo, useRef } from 'react'
import { CircleDollarSign } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { trackCardSeen } from '#/shared/analytics/paymentCardSeen'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractPaymentMarkedSnapshotV3 } from './offerEventCardUtils'

interface PaymentMarkedCardProps {
  message: MessageItem
  viewer: { kind: 'brand' | 'creator' | undefined }
  highlighted?: boolean
}

export function PaymentMarkedCard({
  message,
  viewer,
  highlighted = false,
}: PaymentMarkedCardProps) {
  const snapshot = useMemo(
    () => extractPaymentMarkedSnapshotV3(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (
      !snapshot?.declaredPaymentId ||
      viewer.kind !== 'creator' ||
      hasFiredRef.current ||
      !cardRef.current
    ) {
      return
    }

    const declaredPaymentId = snapshot.declaredPaymentId

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

  const side = viewer.kind === 'brand' ? 'out' : 'in'

  return (
    <article
      ref={cardRef}
      role="article"
      aria-label={t`Pago marcado`}
      data-testid="payment-marked-card"
      data-highlighted={highlighted ? 'true' : undefined}
    >
      <EventBubble
        severity="success"
        direction={side}
        icon={CircleDollarSign}
      >
        {t`Pago marcado`}
      </EventBubble>
    </article>
  )
}
