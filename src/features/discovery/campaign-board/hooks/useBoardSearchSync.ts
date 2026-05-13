import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import type { CampaignBoardSearch } from '../search-schema'

type CampaignBoardSearchPatch = Partial<
  Omit<CampaignBoardSearch, 'recommended_only' | 'sort'>
> & {
  recommended_only?: boolean
  sort?: CampaignBoardSearch['sort']
}

const defaultCampaignBoardSearch = {
  recommended_only: false,
  sort: 'match_score_desc',
} satisfies CampaignBoardSearch

function compactSearch(search: CampaignBoardSearchPatch): CampaignBoardSearch {
  return {
    ...(search.q !== undefined ? { q: search.q } : {}),
    ...(search.niches !== undefined && search.niches.length > 0
      ? { niches: search.niches }
      : {}),
    ...(search.interests !== undefined && search.interests.length > 0
      ? { interests: search.interests }
      : {}),
    ...(search.platforms !== undefined && search.platforms.length > 0
      ? { platforms: search.platforms }
      : {}),
    ...(search.deliverables !== undefined && search.deliverables.length > 0
      ? { deliverables: search.deliverables }
      : {}),
    ...(search.fee_min_amount !== undefined
      ? { fee_min_amount: search.fee_min_amount }
      : {}),
    ...(search.fee_max_amount !== undefined
      ? { fee_max_amount: search.fee_max_amount }
      : {}),
    ...(search.min_match_score !== undefined
      ? { min_match_score: search.min_match_score }
      : {}),
    recommended_only: search.recommended_only ?? false,
    sort: search.sort ?? 'match_score_desc',
  }
}

export function useBoardSearchSync() {
  const search = useSearch({ from: '/_creator/discover/campaigns' })
  const navigate = useNavigate({ from: '/discover/campaigns' })

  const setSearch = useCallback(
    (patch: CampaignBoardSearchPatch) => {
      void navigate({
        to: '.',
        unsafeRelative: 'path',
        search: (previous) =>
          compactSearch({
            ...previous,
            ...patch,
            cursor: undefined,
          }),
        replace: true,
      })
    },
    [navigate],
  )

  const resetSearch = useCallback(() => {
    void navigate({
      to: '.',
      unsafeRelative: 'path',
      search: defaultCampaignBoardSearch,
      replace: true,
    })
  }, [navigate])

  return {
    search,
    setSearch,
    resetSearch,
  }
}
