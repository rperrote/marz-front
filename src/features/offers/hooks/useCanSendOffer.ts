import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'

import { useActiveCampaigns } from './useActiveCampaigns'

export function useCanSendOffer({
  conversationId: _conversationId,
}: {
  conversationId: string
}): CanSendOfferMeta {
  const meQuery = useMe()
  const { data: activeCampaigns } = useActiveCampaigns()

  const kind = meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined

  if (kind !== 'brand') {
    return { visible: false, disabled: false }
  }

  // RAFITA:BLOCKER: MeResponse / ServerMeBody no expone membership.role todavía.
  // Cuando el backend exponga workspaces + membership, agregar chequeo de owner
  // antes de retornar visible=true.

  const hasActiveCampaigns =
    activeCampaigns !== undefined && activeCampaigns.length > 0

  if (!hasActiveCampaigns) {
    return { visible: true, disabled: true, reason: 'no-active-campaigns' }
  }

  return { visible: true, disabled: false }
}
