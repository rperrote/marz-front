import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { ConversationContextHeader } from '#/features/chat/components/ConversationContextHeader'
import { ConversationView } from '#/features/chat/components/ConversationView'
import { useConversationDetailQuery } from '#/features/chat/queries'
import { ConversationOffersPanel } from '#/features/offers/components/ConversationOffersPanel'
import { SendOfferSidesheet } from '#/features/offers/components/SendOfferSidesheet'
import { useCanSendOffer } from '#/features/offers/hooks/useCanSendOffer'
import { useSendOfferWizard } from '#/features/offers/store/sendOfferWizardStore'
import { MarkAsPaidDialog } from '#/features/payments/components/MarkAsPaidDialog'
import type { MarkAsPaidOffer } from '#/shared/payments/markAsPaidEligibility'
import { SubmitLinkSidesheet } from '#/features/deliverables/components/SubmitLinkSidesheet'
import { UploadDraftDialog } from '#/features/deliverables/components/UploadDraftDialog'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'

export const conversationSearchSchema = z.object({
  highlightPaymentId: z.uuid().optional(),
})

export const Route = createFileRoute(
  '/workspace/conversations/$conversationId',
)({
  validateSearch: conversationSearchSchema,
  // No SSR prefetch: customFetch (client mutator) only has the Clerk token on
  // the client. Prefetching server-side hits the API without auth, the queries
  // dehydrate as rejecting, and `useInfiniteQuery` crashes on hydration trying
  // to read `pages.length` from undefined data. Letting the client fetch on
  // mount costs one extra round-trip but is correct.
  loader: () => undefined,
  component: ConversationRoute,
})

function ConversationRoute() {
  const { conversationId } = Route.useParams()
  const { highlightPaymentId } = Route.useSearch()
  const { accountId, sessionKind, viewerRole } = Route.useRouteContext()
  const canSendOffer = useCanSendOffer({ conversationId })
  const conversationDetail = useConversationDetailQuery(conversationId)
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)
  const openSheet = useSendOfferWizard((s) => s.open)

  const [paymentOffer, setPaymentOffer] = useState<MarkAsPaidOffer | null>(null)
  const [uploadDeliverableId, setUploadDeliverableId] = useState<string | null>(
    null,
  )
  const [submitLinkDeliverableId, setSubmitLinkDeliverableId] = useState<
    string | null
  >(null)
  const [submitLinkIsResubmission, setSubmitLinkIsResubmission] =
    useState(false)

  const isBrand = sessionKind === 'brand'
  const creatorName = conversationDetail.data?.counterpart.display_name ?? ''

  const deliverablesData = deliverablesQuery.data
  const uploadDeliverable =
    uploadDeliverableId && deliverablesData
      ? deliverablesData.deliverables.find((d) => d.id === uploadDeliverableId)
      : undefined
  const uploadLabel =
    uploadDeliverable && uploadDeliverable.current_version != null
      ? (() => {
          const nextVersion = uploadDeliverable.current_version + 1
          return t`Upload draft v${nextVersion}`
        })()
      : t`Upload draft`
  const uploadDeliverableIndex =
    uploadDeliverable && deliverablesData
      ? deliverablesData.deliverables.findIndex(
          (d) => d.id === uploadDeliverable.id,
        )
      : -1
  const uploadAnalytics =
    uploadDeliverable &&
    deliverablesData?.offer_mode != null &&
    uploadDeliverableIndex >= 0
      ? {
          offerMode: deliverablesData.offer_mode,
          deliverableIndex: uploadDeliverableIndex,
          deliverableStatus: uploadDeliverable.status,
          currentVersion: uploadDeliverable.current_version,
          latestChangeRequestedAt:
            uploadDeliverable.latest_change_request?.requested_at ?? null,
        }
      : undefined
  const submitLinkDeliverable =
    submitLinkDeliverableId && deliverablesData
      ? deliverablesData.deliverables.find(
          (d) => d.id === submitLinkDeliverableId,
        )
      : undefined

  const handleSubmitLink = (deliverableId: string, isResubmission: boolean) => {
    setSubmitLinkDeliverableId(deliverableId)
    setSubmitLinkIsResubmission(isResubmission)
  }

  const handleSubmitLinkClose = () => {
    setSubmitLinkDeliverableId(null)
    setSubmitLinkIsResubmission(false)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        <ConversationView
          conversationId={conversationId}
          currentAccountId={accountId}
          sessionKind={sessionKind}
          viewerRole={viewerRole}
          onUploadDraft={setUploadDeliverableId}
          highlightPaymentId={highlightPaymentId}
        />
      </div>
      <ConversationOffersPanel
        conversationId={conversationId}
        sessionKind={sessionKind}
        viewerRole={viewerRole}
        onUploadDraft={setUploadDeliverableId}
        onMarkAsPaid={setPaymentOffer}
        onSubmitLink={handleSubmitLink}
        canSendOffer={isBrand ? canSendOffer : undefined}
        onSendOffer={isBrand ? () => openSheet(conversationId) : undefined}
        headerSlot={
          conversationDetail.data ? (
            <ConversationContextHeader
              counterpart={conversationDetail.data.counterpart}
              sessionKind={sessionKind}
            />
          ) : null
        }
      />
      {paymentOffer ? (
        <MarkAsPaidDialog
          open
          offer={paymentOffer}
          conversationId={conversationId}
          onOpenChange={(open) => {
            if (!open) setPaymentOffer(null)
          }}
        />
      ) : null}
      {uploadDeliverableId && (
        <UploadDraftDialog
          open={!!uploadDeliverableId}
          onOpenChange={(open) => {
            if (!open) setUploadDeliverableId(null)
          }}
          deliverableId={uploadDeliverableId}
          conversationId={conversationId}
          onSuccess={() => setUploadDeliverableId(null)}
          title={uploadLabel}
          analytics={uploadAnalytics}
        />
      )}
      {submitLinkDeliverable && (
        <SubmitLinkSidesheet
          open={!!submitLinkDeliverableId}
          onOpenChange={(open) => {
            if (!open) handleSubmitLinkClose()
          }}
          deliverableId={submitLinkDeliverable.id}
          platform={submitLinkDeliverable.platform}
          isResubmission={submitLinkIsResubmission}
          onSubmitted={handleSubmitLinkClose}
        />
      )}
      {isBrand && conversationDetail.data?.counterpart.id ? (
        <SendOfferSidesheet
          creatorName={creatorName}
          creatorAccountId={conversationDetail.data.counterpart.id}
        />
      ) : null}
    </div>
  )
}
