import { useCallback } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { useApproveDraft } from '#/features/deliverables/hooks/useApproveDraft'

interface ApproveDraftButtonProps {
  deliverableId: string
  conversationId: string
  version: number
  currentVersion: number | null
  onApproved?: () => void
}

export function ApproveDraftButton({
  deliverableId,
  conversationId,
  version,
  currentVersion,
  onApproved,
}: ApproveDraftButtonProps) {
  const approveDraft = useApproveDraft(deliverableId, conversationId)

  const resolvedCurrentVersion = currentVersion ?? version
  const isStale = version !== resolvedCurrentVersion
  const isPending = approveDraft.isPending
  const tooltipId = `approve-draft-tooltip-${deliverableId}`

  const handleClick = useCallback(() => {
    if (isStale) return
    approveDraft.mutate({ onSuccess: onApproved })
  }, [isStale, approveDraft, onApproved])

  return (
    <div className="relative">
      <Button
        type="button"
        className={cn('w-full', isStale && 'opacity-50 cursor-not-allowed')}
        disabled={isStale || isPending}
        aria-disabled={isStale || isPending ? true : undefined}
        aria-describedby={isStale ? tooltipId : undefined}
        onClick={handleClick}
      >
        {t`Approve draft`}
      </Button>
      {isStale ? (
        <span id={tooltipId} role="tooltip" className="sr-only">
          {t`A newer version was submitted`}
        </span>
      ) : null}
    </div>
  )
}
