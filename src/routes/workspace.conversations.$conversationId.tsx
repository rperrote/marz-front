import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { ConversationView } from '#/features/chat/components/ConversationView'
import { useConversationDetailQuery } from '#/features/chat/queries'
import { ConversationOffersPanel } from '#/features/offers/components/ConversationOffersPanel'
import { SendOfferSidesheet } from '#/features/offers/components/SendOfferSidesheet'
import { useCanSendOffer } from '#/features/offers/hooks/useCanSendOffer'
import { useSendOfferSheetStore } from '#/features/offers/store/sendOfferSheetStore'
import { MarkAsPaidSidesheet } from '#/features/payments/markAsPaid'
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
  const openSheet = useSendOfferSheetStore((s) => s.open)

  const [paymentDeliverableId, setPaymentDeliverableId] = useState<
    string | null
  >(null)
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
      ? t`Upload draft v${uploadDeliverable.current_version + 1}`
      : t`Upload draft`
  const uploadDeliverableIndex =
    uploadDeliverable && deliverablesData
      ? deliverablesData.deliverables.findIndex(
          (d) => d.id === uploadDeliverable.id,
        )
      : -1
  const uploadAnalytics =
    uploadDeliverable &&
    deliverablesData?.offer_type != null &&
    uploadDeliverableIndex >= 0
      ? {
          offerType: deliverablesData.offer_type,
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
          canSendOffer={isBrand ? canSendOffer : undefined}
          onSendOffer={isBrand ? () => openSheet(conversationId) : undefined}
          onMarkAsPaid={setPaymentDeliverableId}
          highlightPaymentId={highlightPaymentId}
        />
      </div>
      <ConversationOffersPanel
        conversationId={conversationId}
        sessionKind={sessionKind}
        viewerRole={viewerRole}
        onUploadDraft={setUploadDeliverableId}
        onMarkAsPaid={setPaymentDeliverableId}
        onSubmitLink={handleSubmitLink}
      />
      <MarkAsPaidSidesheet
        open={paymentDeliverableId !== null}
        deliverableId={paymentDeliverableId}
        creatorName={creatorName}
        onOpenChange={(open) => {
          if (!open) setPaymentDeliverableId(null)
        }}
      />
      {uploadDeliverableId && (
        <UploadDraftDialog
          open={!!uploadDeliverableId}
          onOpenChange={(open) => {
            if (!open) setUploadDeliverableId(null)
          }}
          deliverableId={uploadDeliverableId}
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
      {isBrand ? <SendOfferSidesheet creatorName={creatorName} /> : null}
    </div>
  )
}
