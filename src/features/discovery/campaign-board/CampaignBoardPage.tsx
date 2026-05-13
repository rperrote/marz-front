import { useEffect, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'

import type { CreatorCampaignBoardCard } from '#/shared/api/generated/model'

import { ApplicationDialog } from './ApplicationDialog'
import { CampaignBoardEmptyState } from './CampaignBoardEmptyState'
import { CampaignBoardFilters } from './CampaignBoardFilters'
import { CampaignBriefSheet } from './CampaignBriefSheet'
import {
  CampaignBoardGrid,
  CampaignBoardGridSkeleton,
} from './CampaignBoardGrid'
import { CampaignBoardHeader } from './CampaignBoardHeader'
import { CampaignBoardSort } from './CampaignBoardSort'
import { useCampaignBoardQuery } from './hooks/useCampaignBoardQuery'
import { useBoardSearchSync } from './hooks/useBoardSearchSync'
import type { CampaignBoardSearch } from './search-schema'
import { trackBoardEvent } from './utils/analytics'
import {
  activeFilterTypes,
  classifyEmptyState,
} from './utils/classifyEmptyState'

export function CampaignBoardPage() {
  const { search, setSearch, resetSearch } = useBoardSearchSync()
  const boardQuery = useCampaignBoardQuery(search)
  const cards = boardQuery.data?.data ?? []
  const emptyStateType = classifyEmptyState({
    data: boardQuery.data,
    search,
    error: boardQuery.isError,
  })
  const hasTrackedViewedRef = useRef(false)
  const trackedEmptyStateTypesRef = useRef(new Set<string>())
  const [selectedBriefCampaignId, setSelectedBriefCampaignId] = useState<
    string | null
  >(null)
  const [applicationCard, setApplicationCard] =
    useState<CreatorCampaignBoardCard | null>(null)

  useEffect(() => {
    if (!boardQuery.isSuccess) return
    if (hasTrackedViewedRef.current) return

    hasTrackedViewedRef.current = true
    trackBoardEvent('campaign_board_viewed', {
      total_campaigns: boardQuery.data.counts.total_visible,
      recommended_campaigns: boardQuery.data.counts.recommended,
    })
  }, [boardQuery.data, boardQuery.isSuccess])

  useEffect(() => {
    if (!emptyStateType) return
    if (trackedEmptyStateTypesRef.current.has(emptyStateType)) return

    trackedEmptyStateTypesRef.current.add(emptyStateType)
    trackBoardEvent('campaign_board_empty_state_seen', {
      empty_state_type: emptyStateType,
    })
  }, [emptyStateType])

  function handleSearchChange(patch: Partial<CampaignBoardSearch>) {
    if ('q' in patch && patch.q !== search.q) {
      trackBoardEvent('campaign_board_searched', {
        has_query: Boolean(patch.q),
      })
    }

    if (
      'sort' in patch &&
      patch.sort !== undefined &&
      patch.sort !== search.sort
    ) {
      trackBoardEvent('campaign_board_sorted', { sort_option: patch.sort })
    }

    const tracksFilterChange = Object.keys(patch).some(
      (key) => key !== 'q' && key !== 'sort' && key !== 'cursor',
    )

    if (tracksFilterChange) {
      const nextSearch = { ...search, ...patch }
      trackBoardEvent('campaign_board_filtered', {
        filter_types: activeFilterTypes(nextSearch),
        recommended_only: nextSearch.recommended_only,
      })
    }

    setSearch(patch)
  }

  function handleResetSearch() {
    trackBoardEvent('campaign_board_filtered', {
      filter_types: [],
      recommended_only: false,
    })
    resetSearch()
  }

  function findCard(campaignId: string) {
    return cards.find((card) => card.campaign_id === campaignId)
  }

  function campaignInteractionPayload(card: CreatorCampaignBoardCard) {
    return {
      match_score_range: card.match.band,
      recommended: card.match.recommended,
    }
  }

  function openBrief(campaignId: string) {
    const card = findCard(campaignId)
    if (card) {
      trackBoardEvent('campaign_board_brief_opened', {
        ...campaignInteractionPayload(card),
      })
    }
    setSelectedBriefCampaignId(campaignId)
  }

  function startApplication(card: CreatorCampaignBoardCard) {
    trackBoardEvent('campaign_board_application_started', {
      ...campaignInteractionPayload(card),
    })
    setApplicationCard(card)
  }

  function handleEmptyStateAction() {
    if (emptyStateType === 'error') {
      void boardQuery.refetch()
      return
    }

    if (emptyStateType === 'no_filters') {
      handleResetSearch()
      return
    }

    if (emptyStateType === 'no_campaigns') {
      // F.4-creator-profile-navigation: profile navigation is pending.
      return
    }

    if (emptyStateType === 'no_recommendations') {
      handleSearchChange({ recommended_only: false })
    }
  }

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-[1368px] flex-col gap-6 p-8">
        <CampaignBoardHeader
          isRefreshing={boardQuery.isFetching && !boardQuery.isPending}
          onRefresh={() => void boardQuery.refetch()}
        />

        <CampaignBoardFilters
          search={search}
          available={boardQuery.data?.filters.available}
          onSearchChange={handleSearchChange}
          onReset={handleResetSearch}
        />

        <div className="flex items-center justify-between gap-4">
          <CampaignBoardResultSummary
            totalVisible={
              boardQuery.data?.counts.matching_filters ??
              boardQuery.data?.counts.total_visible
            }
            recommended={boardQuery.data?.counts.recommended}
          />
          <CampaignBoardSort
            value={search.sort}
            onChange={(sort) => handleSearchChange({ sort })}
          />
        </div>

        {boardQuery.isPending ? <CampaignBoardGridSkeleton /> : null}

        {emptyStateType ? (
          <CampaignBoardEmptyState
            type={emptyStateType}
            onAction={handleEmptyStateAction}
          />
        ) : null}

        {boardQuery.isSuccess && cards.length > 0 ? (
          <CampaignBoardGrid
            cards={cards}
            onViewBrief={openBrief}
            onApply={startApplication}
          />
        ) : null}
      </div>
      <CampaignBriefSheet
        campaignId={selectedBriefCampaignId}
        onApply={startApplication}
        onOpenChange={(open) => {
          if (!open) setSelectedBriefCampaignId(null)
        }}
      />
      <ApplicationDialog
        open={applicationCard !== null}
        campaignId={applicationCard?.campaign_id ?? null}
        campaignName={
          typeof applicationCard?.campaign.name === 'string'
            ? applicationCard.campaign.name
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setApplicationCard(null)
        }}
        onViewApplication={openBrief}
        onSubmitted={() => {
          if (!applicationCard) return
          trackBoardEvent('campaign_board_application_submitted', {
            ...campaignInteractionPayload(applicationCard),
          })
        }}
      />
    </main>
  )
}

function CampaignBoardResultSummary({
  totalVisible,
  recommended,
}: {
  totalVisible?: number
  recommended?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold text-foreground">
        {t`${totalVisible ?? 0} campañas`}
      </p>
      <span className="text-muted-foreground" aria-hidden="true">
        ·
      </span>
      <p className="text-xs text-muted-foreground">
        {t`${recommended ?? 0} recomendadas para vos`}
      </p>
    </div>
  )
}
