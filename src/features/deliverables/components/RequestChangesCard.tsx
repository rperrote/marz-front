import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { formatMessageDateTime } from '#/shared/ui/formatMessageDateTime'
import { getRecord, getString } from '#/shared/utils/record'
import { ChangeCategoryChip } from './ChangeCategoryChip'
import {
  trackLinkCardSeen,
  trackRequestChangesCardSeen,
  useTrackOnceVisible,
} from '#/features/deliverables/analytics'
import type { DraftTimelineMessage } from '../types'
import type { PublishedLinkPreview } from '#/features/deliverables/types'
import type {
  ChangesRequestedSnapshot,
  LinkChangesRequestedSnapshot,
} from '#/shared/ws/types'
import { LinkPreviewBlock } from './LinkPreviewBlock'
import { parseLinkPreview } from './LinkSubmittedCard'

interface RequestChangesCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  counterpartDisplayName: string
  sessionKind?: 'brand' | 'creator'
  target?: 'draft' | 'link'
}

type RequestChangesSnapshot =
  | (ChangesRequestedSnapshot & { target: 'draft' })
  | (LinkChangesRequestedSnapshot & { target: 'link' })

function extractSnapshot(
  payload: Record<string, unknown> | null,
  target: 'draft' | 'link',
): RequestChangesSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (!Array.isArray(snapshot.categories)) return null

  if (target === 'draft') {
    if (typeof snapshot.draft_version !== 'number') return null
    return { ...(snapshot as unknown as ChangesRequestedSnapshot), target }
  }

  const link = getRecord(snapshot.link) ?? snapshot
  if (typeof link.url !== 'string') return null

  return {
    event_type: 'LinkChangesRequested',
    deliverable_id: getString(snapshot.deliverable_id) ?? '',
    deliverable_platform: getString(snapshot.deliverable_platform) ?? '',
    deliverable_format: getString(snapshot.deliverable_format) ?? '',
    deliverable_offer_stage_id:
      getString(snapshot.deliverable_offer_stage_id) ?? null,
    link: {
      id: getString(link.id) ?? '',
      url: link.url,
      status: 'changes_requested',
      preview: link.preview ?? snapshot.preview ?? null,
    },
    categories: snapshot.categories,
    notes: getString(snapshot.notes),
    requested_at: getString(snapshot.requested_at) ?? '',
    requested_by_account_id: getString(snapshot.requested_by_account_id) ?? '',
    target,
  }
}

const CATEGORY_LABELS: Record<string, () => string> = {
  product_placement: () => t`Product placement`,
  pacing: () => t`Pacing`,
  audio: () => t`Audio`,
  discount_code: () => t`Discount code`,
  other: () => t`Other`,
}

const urlOnlyPreview: PublishedLinkPreview = { outcome: 'url_only' }

export function RequestChangesCard({
  message,
  currentAccountId,
  counterpartDisplayName,
  sessionKind,
  target = 'draft',
}: RequestChangesCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload, target),
    [message.payload, target],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef(false)
  const linkPreview = useMemo<PublishedLinkPreview | null>(
    () =>
      snapshot?.target === 'link'
        ? (parseLinkPreview(snapshot.link.preview) ?? urlOnlyPreview)
        : null,
    [snapshot],
  )
  const handleLinkCardSeen = useCallback(() => {
    if (snapshot?.target !== 'link') return
    trackLinkCardSeen({
      deliverable_id: snapshot.deliverable_id,
      link_id: snapshot.link.id,
      platform: snapshot.deliverable_platform,
      outcome: linkPreview?.outcome ?? 'url_only',
    })
  }, [linkPreview?.outcome, snapshot])
  useTrackOnceVisible(
    cardRef,
    snapshot?.target === 'link' ? `link_card_seen:${snapshot.link.id}` : null,
    handleLinkCardSeen,
  )

  useEffect(() => {
    if (!snapshot || sessionKind !== 'creator' || !cardRef.current) return

    let timeoutId: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
        )
        if (!isVisible) {
          if (timeoutId != null) {
            window.clearTimeout(timeoutId)
            timeoutId = null
          }
          return
        }
        if (seenRef.current || timeoutId != null) return

        timeoutId = window.setTimeout(() => {
          seenRef.current = true
          trackRequestChangesCardSeen({
            actor_kind: 'creator',
            time_since_request_seconds: Math.max(
              0,
              (Date.now() - Date.parse(snapshot.requested_at)) / 1000,
            ),
          })
          observer.disconnect()
        }, 250)
      },
      { threshold: 0.5 },
    )

    observer.observe(cardRef.current)

    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [sessionKind, snapshot])

  if (!snapshot) return null

  const isOutgoing = snapshot.requested_by_account_id === currentAccountId
  const requesterName = isOutgoing ? t`Tú` : counterpartDisplayName

  const notes = snapshot.notes?.trim() ?? ''

  return (
    <div
      ref={cardRef}
      data-testid="request-changes-card"
      className={cn(
        'flex px-4 py-0.5',
        isOutgoing ? 'justify-end' : 'justify-start',
      )}
    >
      <div className="max-w-[75%]">
        <SystemEventCard
          tone="warning"
          kicker={t`Changes requested`}
          icon={AlertCircle}
          headerVariant="solid"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">
                {requesterName}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {formatMessageDateTime(message.created_at)}
              </span>
            </div>

            {snapshot.target === 'draft' ? (
              <div className="text-xs text-muted-foreground">
                {t`v${snapshot.draft_version}`}
              </div>
            ) : null}

            {snapshot.target === 'draft' && snapshot.draft_thumbnail_url ? (
              <div className="relative w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={snapshot.draft_thumbnail_url}
                  alt={t`Draft thumbnail`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            {snapshot.target === 'link' ? (
              <LinkPreviewBlock
                preview={linkPreview ?? urlOnlyPreview}
                url={snapshot.link.url}
                analytics={{
                  deliverableId: snapshot.deliverable_id,
                  linkId: snapshot.link.id,
                  platform: snapshot.deliverable_platform,
                  outcome: linkPreview?.outcome ?? 'url_only',
                }}
              />
            ) : null}

            {snapshot.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {snapshot.categories.map((category) => (
                  <ChangeCategoryChip
                    key={category}
                    label={CATEGORY_LABELS[category]?.() ?? category}
                    selected
                    readOnly
                  />
                ))}
              </div>
            ) : null}

            <div className="text-sm text-foreground">
              {notes ? (
                <p className="whitespace-pre-wrap">{notes}</p>
              ) : (
                <p className="italic text-muted-foreground">
                  {t`No additional notes`}
                </p>
              )}
            </div>
          </div>
        </SystemEventCard>
      </div>
    </div>
  )
}
