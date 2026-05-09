import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CampaignVideosGrid } from '../CampaignVideosGrid'
import { useCampaignParticipantsQuery } from '../creators/useCampaignParticipantsQuery'
import type { VideosFilterParams } from './VideosFilters'
import { VideosFilters, hasActiveVideoFilters } from './VideosFilters'
import type { CampaignVideosParams } from './useCampaignVideosQuery'

interface VideosTabProps {
  campaignId: string
  search: VideosFilterParams
}

const PAGE_LIMIT = 24
const CREATOR_FILTER_LIMIT = 50

export function VideosTab({ campaignId, search }: VideosTabProps) {
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const prevFiltersRef = useRef(search)
  useEffect(() => {
    const prev = prevFiltersRef.current
    if (
      prev.search !== search.search ||
      prev.status !== search.status ||
      prev.platform !== search.platform ||
      prev.creator_account_id !== search.creator_account_id
    ) {
      setCursor(undefined)
    }
    prevFiltersRef.current = search
  }, [search])

  const filters = useMemo(
    () => ({
      search: search.search,
      status: search.status,
      platform: search.platform,
      creator_account_id: search.creator_account_id,
    }),
    [search.creator_account_id, search.platform, search.search, search.status],
  )
  const gridParams = useMemo(
    () => ({
      ...filters,
      cursor,
      limit: PAGE_LIMIT,
    }),
    [cursor, filters],
  )
  const participantsQuery = useCampaignParticipantsQuery(campaignId, {
    limit: CREATOR_FILTER_LIMIT,
  })
  const participants = participantsQuery.data?.data ?? []
  const activeParticipants = participants.filter(
    (participant) => participant.status !== 'invited',
  )

  const updateFilters = useCallback(
    (nextFilters: VideosFilterParams) => {
      setCursor(undefined)
      void navigate({
        search: (previous) => ({
          ...previous,
          tab: 'videos',
          q: nextFilters.search,
          status: nextFilters.status,
          platform: nextFilters.platform,
          creator_account_id: nextFilters.creator_account_id,
        }),
      })
    },
    [navigate],
  )

  const updateGridParams = useCallback(
    (nextParams: CampaignVideosParams) => {
      setCursor(nextParams.cursor)
      const filtersChanged =
        nextParams.search !== filters.search ||
        nextParams.status !== filters.status ||
        nextParams.platform !== filters.platform ||
        nextParams.creator_account_id !== filters.creator_account_id

      if (!filtersChanged) return

      updateFilters({
        search: nextParams.search,
        status: nextParams.status,
        platform: nextParams.platform,
        creator_account_id: nextParams.creator_account_id,
      })
    },
    [
      filters.creator_account_id,
      filters.platform,
      filters.search,
      filters.status,
      updateFilters,
    ],
  )

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters])
  const inviteCreators = useCallback(() => {
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: 'creators',
        q: undefined,
        status: undefined,
        platform: undefined,
        creator_account_id: undefined,
      }),
    })
  }, [navigate])

  const activeFilters = hasActiveVideoFilters(filters)

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Videos`}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {t`Videos delivered for this campaign`}
          </h2>
        </div>
      </div>

      <VideosFilters
        params={filters}
        creators={activeParticipants}
        onParamsChange={updateFilters}
      />

      <CampaignVideosGrid
        scope={{ type: 'campaign', campaignId }}
        params={gridParams}
        hasActiveFilters={activeFilters}
        hasActiveParticipants={activeParticipants.length > 0}
        onParamsChange={updateGridParams}
        onClearFilters={clearFilters}
        onInviteCreators={inviteCreators}
      />
    </section>
  )
}
