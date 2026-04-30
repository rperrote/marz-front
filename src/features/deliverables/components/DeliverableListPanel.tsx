import { useState } from 'react'
import { t } from '@lingui/core/macro'

import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import type { DeliverableDTO } from '#/features/deliverables/types'
import { UploadDraftDialog } from './UploadDraftDialog'
import { DeliverableListItem } from './DeliverableListItem'
import { MultistagePanelGroup } from './MultistagePanelGroup'

interface DeliverableListPanelProps {
  conversationId: string
  sessionKind: 'brand' | 'creator'
}

export function DeliverableListPanel({
  conversationId,
  sessionKind,
}: DeliverableListPanelProps) {
  const query = useGetConversationDeliverablesQuery(conversationId)
  const [uploadDeliverableId, setUploadDeliverableId] = useState<string | null>(
    null,
  )

  if (query.isLoading) {
    return (
      <div
        className="flex h-full flex-col gap-3 p-3"
        role="status"
        aria-label={t`Loading deliverables`}
      >
        <SkeletonItem />
        <SkeletonItem />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          {t`Error loading deliverables`}
        </p>
      </div>
    )
  }

  const data = query.data

  if (!data || data.offer_id === null) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          {t`No active offer yet.`}
        </p>
      </div>
    )
  }

  const handleUploadDraft = (deliverableId: string) => {
    setUploadDeliverableId(deliverableId)
  }

  const handleDialogClose = () => {
    setUploadDeliverableId(null)
  }

  const deliverableMap = new Map<string, DeliverableDTO>()
  for (const d of data.deliverables) {
    deliverableMap.set(d.id, d)
  }

  const uploadDeliverable = uploadDeliverableId
    ? deliverableMap.get(uploadDeliverableId)
    : undefined

  const uploadLabel =
    uploadDeliverable && uploadDeliverable.current_version != null
      ? t`Upload draft v${uploadDeliverable.current_version + 1}`
      : t`Upload draft`

  return (
    <div className="flex h-full flex-col" data-testid="deliverable-list-panel">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {data.offer_type === 'multistage' ? (
          data.stages.map((stage) => {
            const stageDeliverables = stage.deliverable_ids
              .map((id) => deliverableMap.get(id))
              .filter((d): d is DeliverableDTO => d !== undefined)

            return (
              <MultistagePanelGroup
                key={stage.id}
                stage={stage}
                deliverables={stageDeliverables.map((deliverable) => ({
                  deliverable,
                  sessionKind,
                  onUploadDraft: handleUploadDraft,
                }))}
              />
            )
          })
        ) : (
          <div className="space-y-2">
            {data.deliverables.map((deliverable) => (
              <DeliverableListItem
                key={deliverable.id}
                deliverable={deliverable}
                sessionKind={sessionKind}
                onUploadDraft={handleUploadDraft}
              />
            ))}
          </div>
        )}
      </div>

      {uploadDeliverableId && (
        <UploadDraftDialog
          open={!!uploadDeliverableId}
          onOpenChange={(open) => {
            if (!open) handleDialogClose()
          }}
          deliverableId={uploadDeliverableId}
          onSuccess={handleDialogClose}
          title={uploadLabel}
        />
      )}
    </div>
  )
}

function SkeletonItem() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
