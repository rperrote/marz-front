import {
  ExternalLink,
  Instagram,
  Link as LinkIcon,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import { getRecord, getString } from '#/shared/utils/record'
import type { PublishedLinkPreview } from '#/features/deliverables/types'
import { useApproveLink } from '#/features/deliverables/hooks/useApproveLink'
import {
  trackLinkCardSeen,
  useTrackOnceVisible,
} from '#/features/deliverables/analytics'
import type { DraftTimelineMessage } from '../types'
import type { LinkSubmittedSnapshot } from '#/shared/ws/types'
import { LinkPreviewBlock } from './LinkPreviewBlock'
import { RequestChangesModal } from './RequestChangesModal'

const platformIcon: Record<string, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
}

interface LinkSubmittedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
  brandWorkspaceId: string | null
  sessionKind: 'brand' | 'creator' | undefined
  onApproveLink?: (snapshot: LinkSubmittedSnapshot) => void
  onRequestChangesOnLink?: (snapshot: LinkSubmittedSnapshot) => void
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): LinkSubmittedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  const link = getRecord(snapshot.link) ?? snapshot
  if (typeof link.url !== 'string') return null

  return {
    event_type: 'LinkSubmitted',
    deliverable_id: getString(snapshot.deliverable_id) ?? '',
    deliverable_platform: getString(snapshot.deliverable_platform) ?? '',
    deliverable_format: getString(snapshot.deliverable_format) ?? '',
    deliverable_offer_stage_id:
      getString(snapshot.deliverable_offer_stage_id) ?? null,
    link: {
      id: getString(link.id) ?? '',
      url: link.url,
      status: parseLinkStatus(link.status),
      preview: link.preview ?? snapshot.preview ?? null,
      submitted_at:
        getString(link.submitted_at) ?? getString(snapshot.submitted_at) ?? '',
      submitted_by_account_id:
        getString(link.submitted_by_account_id) ??
        getString(snapshot.submitted_by_account_id) ??
        '',
    },
    message: getString(snapshot.message),
    payout_amount_formatted: getString(snapshot.payout_amount_formatted),
  }
}

export function LinkSubmittedCard({
  message,
  currentAccountId,
  brandWorkspaceId,
  sessionKind,
  onApproveLink,
  onRequestChangesOnLink,
}: LinkSubmittedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )
  const meQuery = useMe()
  const approveLink = useApproveLink(
    snapshot?.deliverable_id ?? '',
    snapshot?.link.id ?? '',
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const preview = useMemo(
    () => (snapshot ? parseLinkPreview(snapshot.link.preview) : null),
    [snapshot],
  )
  const handleCardSeen = useCallback(() => {
    if (!snapshot) return
    trackLinkCardSeen({
      deliverable_id: snapshot.deliverable_id,
      link_id: snapshot.link.id,
      platform:
        snapshot.deliverable_platform ||
        parsePlatformFromUrl(snapshot.link.url),
      ...(preview?.outcome === undefined ? {} : { outcome: preview.outcome }),
    })
  }, [preview?.outcome, snapshot])
  useTrackOnceVisible(
    cardRef,
    snapshot ? `link_card_seen:${snapshot.link.id}` : null,
    handleCardSeen,
  )

  if (!snapshot) return null

  const platform =
    snapshot.deliverable_platform || parsePlatformFromUrl(snapshot.link.url)
  const PlatformIcon = platformIcon[platform] ?? LinkIcon
  const isBrandOwner = isCurrentBrandOwner(
    meQuery.data?.data,
    currentAccountId,
    brandWorkspaceId,
  )
  const showActions =
    sessionKind === 'brand' &&
    isBrandOwner &&
    snapshot.link.status === 'submitted'
  const handleApproveLink = () => {
    if (onApproveLink) {
      onApproveLink(snapshot)
      return
    }

    approveLink.mutate()
  }

  return (
    <SystemEventCard
      ref={cardRef}
      tone="success"
      kicker={t`Published link`}
      icon={LinkIcon}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          {snapshot.message ?? t`Just published! Sharing the link here.`}
        </p>

        {preview ? (
          <LinkPreviewBlock
            preview={preview}
            url={snapshot.link.url}
            analytics={{
              deliverableId: snapshot.deliverable_id,
              linkId: snapshot.link.id,
              platform,
              outcome: preview.outcome,
            }}
          />
        ) : (
          <a
            href={snapshot.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2.5 font-mono text-sm text-success transition-colors hover:bg-surface-active"
          >
            <PlatformIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{snapshot.link.url}</span>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          </a>
        )}

        {showActions ? (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={approveLink.isPending}
              onClick={handleApproveLink}
            >
              {t`Approve link`}
            </Button>
            {onRequestChangesOnLink ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onRequestChangesOnLink(snapshot)}
              >
                {t`Request changes on link`}
              </Button>
            ) : (
              <RequestChangesModal
                title={t`Request changes on link`}
                target="link"
                deliverableId={snapshot.deliverable_id}
                linkId={snapshot.link.id}
                trigger={
                  <Button variant="outline" className="flex-1">
                    {t`Request changes on link`}
                  </Button>
                }
              />
            )}
          </div>
        ) : null}
      </div>
    </SystemEventCard>
  )
}

function isCurrentBrandOwner(
  account: unknown,
  currentAccountId: string,
  brandWorkspaceId: string | null,
): boolean {
  const accountRecord = getRecord(account)
  if (!accountRecord) return false
  if (getString(accountRecord.id) !== currentAccountId) return false
  if (!brandWorkspaceId) return false

  const memberships = accountRecord.brand_memberships
  if (!Array.isArray(memberships)) return false

  return memberships.some((membership) => {
    const membershipRecord = getRecord(membership)
    return (
      getString(membershipRecord?.brand_workspace_id) === brandWorkspaceId &&
      getString(membershipRecord?.role) === 'owner'
    )
  })
}

function parseLinkStatus(
  value: unknown,
): LinkSubmittedSnapshot['link']['status'] {
  if (
    value === 'submitted' ||
    value === 'changes_requested' ||
    value === 'approved' ||
    value === 'rejected'
  ) {
    return value
  }
  return 'submitted'
}

function parsePlatformFromUrl(url: string): string {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'link'
}

export function parseLinkPreview(value: unknown): PublishedLinkPreview | null {
  const preview = getRecord(value)
  const outcome = getString(preview?.outcome)

  if (outcome === 'url_only' || outcome === 'failed') {
    return { outcome }
  }

  if (outcome !== 'title_and_thumbnail') {
    return null
  }

  const title = getString(preview?.title)
  const thumbnailUrl = getString(preview?.thumbnail_url)
  if (!title || !thumbnailUrl) return null

  return {
    outcome: 'title_and_thumbnail',
    title,
    thumbnail_url: thumbnailUrl,
  }
}
