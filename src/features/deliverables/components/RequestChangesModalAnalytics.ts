import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

import {
  trackRequestChangesModalDismissed,
  trackRequestChangesModalOpened,
} from '#/features/deliverables/analytics'
import type { OfferMode } from '#/features/offers/types'

export interface RequestChangesModalAnalyticsPayload {
  offerMode: OfferMode
  deliverableIndex: number
  draftVersion: number
  roundIndex: number
}

export function useRequestChangesModalAnalytics(
  analytics: RequestChangesModalAnalyticsPayload | undefined,
  submittedRef: MutableRefObject<boolean>,
) {
  const openedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!analytics) return

    openedAtRef.current = Date.now()
    submittedRef.current = false
    trackRequestChangesModalOpened({
      actor_kind: 'brand',
      offer_mode: analytics.offerMode,
      deliverable_index: analytics.deliverableIndex,
      draft_version: analytics.draftVersion,
    })

    return () => {
      const openedAt = openedAtRef.current
      openedAtRef.current = null
      if (openedAt == null || submittedRef.current) return

      trackRequestChangesModalDismissed({
        actor_kind: 'brand',
        time_in_modal_seconds: Math.max(0, (Date.now() - openedAt) / 1000),
      })
    }
  }, [analytics, submittedRef])
}
