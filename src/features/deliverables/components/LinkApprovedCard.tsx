import { useCallback, useMemo, useRef } from 'react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { EventBubble } from '#/shared/ui/EventBubble'
import { getRecord, getString } from '#/shared/utils/record'
import {
  trackLinkCardSeen,
  useTrackOnceVisible,
} from '#/features/deliverables/analytics'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { canMarkDeliverableAsPaid } from '#/shared/payments/markAsPaidPermissions'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import type { DraftTimelineMessage } from '../types'
import type { LinkApprovedSnapshot } from '#/shared/ws/types'

interface LinkApprovedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  conversationId?: string
  viewer?: MarkAsPaidViewer
  onMarkAsPaid?: (deliverableId: string) => void
}

export function LinkApprovedCard({
  message,
  currentAccountId,
  conversationId,
  viewer,
  onMarkAsPaid,
}: LinkApprovedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const outcome = snapshot ? extractPreviewOutcome(snapshot.link.preview) : null
  const handleCardSeen = useCallback(() => {
    if (!snapshot) return
    trackLinkCardSeen({
      deliverable_id: snapshot.deliverable_id,
      link_id: snapshot.link.id,
      platform: snapshot.deliverable_platform,
      ...(outcome === null ? {} : { outcome }),
    })
  }, [outcome, snapshot])
  useTrackOnceVisible(
    cardRef,
    snapshot ? `link_card_seen:${snapshot.link.id}` : null,
    handleCardSeen,
  )

  if (!snapshot) return null

  const direction =
    snapshot.approved_by_account_id === currentAccountId ? 'out' : 'in'

  return (
    <div
      ref={cardRef}
      className="flex flex-col items-center gap-2 py-1"
      data-testid="link-approved-card"
    >
      <EventBubble severity="success" direction={direction}>
        <span>{t`Link approved`}</span>
        <a
          href={snapshot.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono underline underline-offset-2"
        >
          {snapshot.link.url}
        </a>
      </EventBubble>
      {conversationId && viewer ? (
        <MarkAsPaidAction
          conversationId={conversationId}
          deliverableId={snapshot.deliverable_id}
          viewer={viewer}
          onMarkAsPaid={onMarkAsPaid}
        />
      ) : null}
    </div>
  )
}

interface MarkAsPaidActionProps {
  conversationId: string
  deliverableId: string
  viewer: MarkAsPaidViewer
  onMarkAsPaid?: (deliverableId: string) => void
}

function MarkAsPaidAction({
  conversationId,
  deliverableId,
  viewer,
  onMarkAsPaid,
}: MarkAsPaidActionProps) {
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)
  const deliverable = deliverablesQuery.data?.deliverables.find(
    (item) => item.id === deliverableId,
  )
  const canMarkAsPaid = canMarkDeliverableAsPaid({
    viewer,
    deliverableStatus: deliverable?.status,
  })
  if (!canMarkAsPaid) return null
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onMarkAsPaid?.(deliverableId)}
    >
      {t`Mark as paid`}
    </Button>
  )
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): LinkApprovedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  const link = getRecord(snapshot.link) ?? snapshot
  const url = getString(link.url)
  if (!url) return null

  return {
    event_type: 'LinkApproved',
    deliverable_id: getString(snapshot.deliverable_id) ?? '',
    deliverable_platform: getString(snapshot.deliverable_platform) ?? '',
    deliverable_format: getString(snapshot.deliverable_format) ?? '',
    deliverable_offer_stage_id:
      getString(snapshot.deliverable_offer_stage_id) ?? null,
    link: {
      id: getString(link.id) ?? '',
      url,
      status: 'approved',
      preview: link.preview ?? snapshot.preview ?? null,
    },
    approved_at: getString(snapshot.approved_at) ?? '',
    approved_by_account_id: getString(snapshot.approved_by_account_id) ?? '',
  }
}

function extractPreviewOutcome(
  preview: unknown,
): 'title_and_thumbnail' | 'url_only' | 'failed' | null {
  const outcome = getString(getRecord(preview)?.outcome)
  if (
    outcome === 'title_and_thumbnail' ||
    outcome === 'url_only' ||
    outcome === 'failed'
  ) {
    return outcome
  }
  return null
}
