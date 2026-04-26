import { useEffect } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { useBriefBuilderStore } from '../store'
import { trackBriefBuilderAbandonedBeacon } from '../analytics/brief-builder-analytics'

function useIsDirty(): boolean {
  const currentPhase = useBriefBuilderStore((s) => s.currentPhase)
  const campaignId = useBriefBuilderStore((s) => s.campaignId)
  return currentPhase >= 1 && campaignId === null
}

export function useLeaveGuard() {
  const isDirty = useIsDirty()
  const currentPhase = useBriefBuilderStore((s) => s.currentPhase)
  const processingToken = useBriefBuilderStore((s) => s.processingToken)

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
  }, [isDirty, currentPhase, processingToken])

  return { blocker, isDirty }
}
