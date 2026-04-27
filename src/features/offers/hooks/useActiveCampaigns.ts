import { useQuery } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

export interface ActiveCampaign {
  id: string
  name: string
  status: 'active'
  budget_currency: string
  budget_remaining: string
}

interface ListCampaignsResponse {
  data: ActiveCampaign[]
  status: number
}

// RAFITA:BLOCKER: Orval hook `useListCampaigns` not yet generated (backend hasn't deployed campaigns endpoints).
// This is a manual stub that hits the expected endpoint. Replace with Orval-generated hook after `pnpm api:sync`.
// RAFITA:BLOCKER: brandWorkspaceId hardcoded to 'default' — no workspace store exposed by Identity yet.
// When Identity exposes the active workspace via session/store, replace 'default' with the real id.
export function useActiveCampaigns() {
  const brandWorkspaceId = 'default'
  return useQuery<ActiveCampaign[]>({
    queryKey: [
      '/v1/campaigns',
      { status: 'active', brand_workspace_id: brandWorkspaceId },
    ],
    queryFn: async () => {
      const response = await customFetch<ListCampaignsResponse>(
        `/v1/campaigns?status=active&brand_workspace_id=${encodeURIComponent(brandWorkspaceId)}`,
      )
      return response.data
    },
  })
}
