import { useCallback } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { useApproveDraft } from '#/features/deliverables/hooks/useApproveDraft'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/draftUpload'

interface ApproveDraftButtonProps {
  deliverableId: string
  conversationId: string
  version: number
  onApproved?: () => void
}

export function ApproveDraftButton({
  deliverableId,
  conversationId,
  version,
  onApproved,
}: ApproveDraftButtonProps) {
  const approveDraft = useApproveDraft(deliverableId, conversationId)
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)

  const deliverables = deliverablesQuery.data?.data.data ?? []

  const currentVersion =
    deliverables.find((d) => d.id === deliverableId)?.current_version ?? version

  const isStale = version !== currentVersion
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
