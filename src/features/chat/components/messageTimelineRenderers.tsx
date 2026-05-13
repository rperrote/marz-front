import { t } from '@lingui/core/macro'

import type { MessageItem } from '#/features/chat/types'
import { DraftApprovedCard } from '#/features/deliverables/components/DraftApprovedCard'
import { DraftSubmittedCard } from '#/features/deliverables/components/DraftSubmittedCard'
import { LinkApprovedCard } from '#/features/deliverables/components/LinkApprovedCard'
import { LinkChangesRequestedCard } from '#/features/deliverables/components/LinkChangesRequestedCard'
import { LinkSubmittedCard } from '#/features/deliverables/components/LinkSubmittedCard'
import { RequestChangesCard } from '#/features/deliverables/components/RequestChangesCard'
import { OfferTimelineEntry } from '#/features/offers/components/OfferTimelineEntry'
import { StageOpenedBubble } from '#/features/offers/components/StageOpenedBubble'
import { stageOpenedSnapSchema } from '#/features/offers/schemas'
import type { MarkAsPaidViewerRole } from '#/shared/payments/markAsPaidPermissions'
import { OFFER_EVENT_TYPES } from '#/shared/offers/constants'
import { getRecord, getString } from '#/shared/utils/record'
import { EventBubble } from './EventBubble'
import type { EventSeverity } from './EventBubble'
import { MessageBubble } from './MessageBubble'
import { PaymentMarkedCard } from './systemEvents/PaymentMarkedCard'

interface RenderTimelineMessageContentArgs {
  message: MessageItem
  currentAccountId: string
  conversationId: string
  counterpartDisplayName: string
  highlightPaymentId?: string
  onMarkAsPaid?: (deliverableId: string) => void
  onUploadDraft?: (deliverableId: string) => void
  sessionKind: 'brand' | 'creator' | undefined
  viewerRole?: MarkAsPaidViewerRole
}

export function renderTimelineMessageContent({
  message,
  currentAccountId,
  conversationId,
  counterpartDisplayName,
  highlightPaymentId,
  onMarkAsPaid,
  onUploadDraft,
  sessionKind,
  viewerRole,
}: RenderTimelineMessageContentArgs) {
  if (message.type === 'system_event') {
    return renderSystemTimelineMessage({
      message,
      currentAccountId,
      conversationId,
      counterpartDisplayName,
      highlightPaymentId,
      onMarkAsPaid,
      onUploadDraft,
      sessionKind,
      viewerRole,
    })
  }

  if (!message.text_content) return null

  const isOwn = message.author_account_id === currentAccountId
  const direction = isOwn ? 'out' : 'in'
  const authorDisplayName = isOwn ? t`Tú` : counterpartDisplayName

  return (
    <MessageBubble
      direction={direction}
      text={message.text_content}
      authorDisplayName={authorDisplayName}
      timestamp={message.created_at}
    />
  )
}

function renderSystemTimelineMessage({
  message,
  currentAccountId,
  conversationId,
  counterpartDisplayName,
  highlightPaymentId,
  onMarkAsPaid,
  onUploadDraft,
  sessionKind,
  viewerRole,
}: RenderTimelineMessageContentArgs) {
  const deliverableEventType = parseDeliverableSystemEventType(
    message.event_type,
  )

  if (deliverableEventType) {
    switch (deliverableEventType) {
      case 'DraftSubmitted':
        return (
          <DraftSubmittedCard
            message={message}
            currentAccountId={currentAccountId}
            counterpartDisplayName={counterpartDisplayName}
            conversationId={conversationId}
            sessionKind={sessionKind}
          />
        )
      case 'DraftApproved':
        return (
          <DraftApprovedCard
            message={message}
            currentAccountId={currentAccountId}
            counterpartDisplayName={counterpartDisplayName}
            sessionKind={sessionKind}
          />
        )
      case 'ChangesRequested':
        return (
          <RequestChangesCard
            message={message}
            currentAccountId={currentAccountId}
            counterpartDisplayName={counterpartDisplayName}
            sessionKind={sessionKind}
          />
        )
      case 'LinkSubmitted':
        return (
          <LinkSubmittedCard
            message={message}
            currentAccountId={currentAccountId}
            brandWorkspaceId={extractBrandWorkspaceId(message.payload)}
            sessionKind={sessionKind}
          />
        )
      case 'LinkApproved':
        return (
          <LinkApprovedCard
            message={message}
            currentAccountId={currentAccountId}
            conversationId={conversationId}
            viewer={{ kind: sessionKind, role: viewerRole }}
            onMarkAsPaid={onMarkAsPaid}
          />
        )
      case 'LinkChangesRequested':
        return (
          <LinkChangesRequestedCard
            message={message}
            currentAccountId={currentAccountId}
            counterpartDisplayName={counterpartDisplayName}
            sessionKind={sessionKind}
          />
        )
      default:
        return assertNever(deliverableEventType)
    }
  }

  if (message.event_type === 'PaymentMarked') {
    return (
      <PaymentMarkedCard
        message={message}
        viewer={{ kind: sessionKind }}
        highlighted={
          highlightPaymentId !== undefined &&
          getPaymentMarkedDeclaredPaymentId(message.payload) ===
            highlightPaymentId
        }
      />
    )
  }

  if (message.event_type === 'StageOpened') {
    const rawPayload = message.payload ?? {}
    const snapshot =
      (rawPayload['snapshot'] as Record<string, unknown> | undefined) ??
      rawPayload
    const parsed = stageOpenedSnapSchema.safeParse(snapshot)
    if (!parsed.success) return null
    const side = message.author_account_id === currentAccountId ? 'out' : 'in'
    return (
      <div className="flex justify-center py-1">
        <StageOpenedBubble snapshot={parsed.data} side={side} />
      </div>
    )
  }

  if (message.event_type === 'StageApproved') {
    console.warn('StageApproved rendering not implemented yet (FEAT-009)')
    return null
  }

  if (OFFER_EVENT_TYPES.has(message.event_type ?? '')) {
    return (
      <OfferTimelineEntry
        message={message}
        currentAccountId={currentAccountId}
        conversationId={conversationId}
        counterpartDisplayName={counterpartDisplayName}
        onUploadDraft={onUploadDraft}
      />
    )
  }

  const label =
    (message.payload?.['display_text'] as string | undefined) ??
    message.event_type ??
    t`Evento del sistema`
  return (
    <div className="flex justify-center py-1">
      <EventBubble
        severity={resolveEventSeverity(message.event_type)}
        direction="out"
      >
        {label}
      </EventBubble>
    </div>
  )
}

export function getPaymentMarkedDeclaredPaymentId(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload) return null
  const snapshot =
    // RAFITA:ANY: payload es Record<string, unknown> — el snapshot no tiene tipo estático disponible en este contexto
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  const declaredPaymentId = snapshot.declared_payment_id
  return typeof declaredPaymentId === 'string' ? declaredPaymentId : null
}

function extractBrandWorkspaceId(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload) return null
  const snapshot = getRecord(payload.snapshot)
  return (
    getString(payload.brand_workspace_id) ??
    getString(snapshot?.brand_workspace_id)
  )
}

const DELIVERABLE_SYSTEM_EVENT_TYPES = [
  'DraftSubmitted',
  'DraftApproved',
  'ChangesRequested',
  'LinkSubmitted',
  'LinkApproved',
  'LinkChangesRequested',
] as const

type DeliverableSystemEventType =
  (typeof DELIVERABLE_SYSTEM_EVENT_TYPES)[number]

function parseDeliverableSystemEventType(
  eventType: string | null,
): DeliverableSystemEventType | null {
  const knownEventTypes: readonly string[] = DELIVERABLE_SYSTEM_EVENT_TYPES
  return eventType && knownEventTypes.includes(eventType)
    ? (eventType as DeliverableSystemEventType)
    : null
}

function assertNever(value: never): never {
  throw new Error(`Unhandled deliverable system event: ${String(value)}`)
}

const EVENT_SEVERITY_MAP: Record<string, EventSeverity> = {
  offer_accepted: 'success',
  offer_completed: 'success',
  deliverable_approved: 'success',
  payment_released: 'success',
  offer_rejected: 'destructive',
  offer_cancelled: 'destructive',
  deliverable_rejected: 'destructive',
  offer_sent: 'info',
  deliverable_submitted: 'info',
  offer_expired: 'warning',
  revision_requested: 'warning',
}

function resolveEventSeverity(eventType: string | null): EventSeverity {
  if (!eventType) return 'info'
  return EVENT_SEVERITY_MAP[eventType] ?? 'info'
}
