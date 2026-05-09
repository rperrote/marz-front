import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ConversationView } from '#/features/chat/components/ConversationView'
import { useConversationDetailQuery } from '#/features/chat/queries'
import { DeliverableListPanel } from '#/features/deliverables/components/DeliverableListPanel'
import { useCanSendOffer } from '#/features/offers/hooks/useCanSendOffer'
import { useSendOfferSheetStore } from '#/features/offers/store/sendOfferSheetStore'
import { MarkAsPaidSidesheet } from '#/features/payments/markAsPaid'

export const Route = createFileRoute(
  '/workspace/conversations/$conversationId',
)({
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
  const { accountId, sessionKind, viewerRole } = Route.useRouteContext()
  const canSendOffer = useCanSendOffer({ conversationId })
  const conversationDetail = useConversationDetailQuery(conversationId)
  const openSheet = useSendOfferSheetStore((s) => s.open)
  const [paymentDeliverableId, setPaymentDeliverableId] = useState<
    string | null
  >(null)
  const isBrand = sessionKind === 'brand'
  const creatorName = conversationDetail.data?.counterpart.display_name ?? ''

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
        />
      </div>
      <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-background">
        <DeliverableListPanel
          conversationId={conversationId}
          sessionKind={sessionKind}
          viewerRole={viewerRole}
          onMarkAsPaid={setPaymentDeliverableId}
        />
      </aside>
      <MarkAsPaidSidesheet
        open={paymentDeliverableId !== null}
        deliverableId={paymentDeliverableId}
        creatorName={creatorName}
        onOpenChange={(open) => {
          if (!open) setPaymentDeliverableId(null)
        }}
      />
    </div>
  )
}
