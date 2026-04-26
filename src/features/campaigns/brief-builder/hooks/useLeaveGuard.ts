import { useEffect, useRef } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { useBriefBuilderStore } from '../store'
import { trackBriefBuilderAbandonedBeacon } from '../analytics/brief-builder-analytics'

function useIsDirty(): boolean {
  const currentPhase = useBriefBuilderStore((s) => s.currentPhase)
  const campaignId = useBriefBuilderStore((s) => s.campaignId)
  const processingToken = useBriefBuilderStore((s) => s.processingToken)
  const formInput = useBriefBuilderStore((s) => s.formInput)
  const pdfFile = useBriefBuilderStore((s) => s.pdfFile)

  if (campaignId !== null) return false
  if (currentPhase >= 2) return true
  if (processingToken !== null) return true

  const hasInput =
    formInput.websiteUrl.trim().length > 0 ||
    formInput.descriptionText.trim().length > 0 ||
    pdfFile !== null

  return hasInput
}

export function useLeaveGuard() {
  const isDirty = useIsDirty()
  const storeRef = useRef(useBriefBuilderStore.getState())

  useEffect(() => {
    return useBriefBuilderStore.subscribe((s) => {
      storeRef.current = s
    })
  }, [])

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    withResolver: true,
  })

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const handlePageHide = () => {
      const { currentPhase, processingToken } = storeRef.current
      trackBriefBuilderAbandonedBeacon({
        phase: currentPhase,
        processing_token: processingToken,
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [isDirty])

  return { blocker, isDirty }
}
