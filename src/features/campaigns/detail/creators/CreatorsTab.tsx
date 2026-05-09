import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import type { CampaignPlanCapabilities } from '#/shared/api/generated/model'

import { CampaignCreatorsTable } from '../CampaignCreatorsTable'
import { CreatorsFilters, hasActiveFilters } from './CreatorsFilters'
import type { CreatorsFilterParams } from './CreatorsFilters'
import type { CampaignParticipantsParams } from './useCampaignParticipantsQuery'

interface CreatorsTabProps {
  campaignId: string
  planCapabilities: CampaignPlanCapabilities
  search: CreatorsFilterParams
}

const PAGE_LIMIT = 24

export function CreatorsTab({
  campaignId,
  planCapabilities,
  search,
}: CreatorsTabProps) {
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const openInviteCreatorRef = useRef<(() => void) | null>(null)

  const filters = useMemo(
    () => ({
      search: search.search,
      status: search.status,
      platform: search.platform,
    }),
    [search.platform, search.search, search.status],
  )
  const tableParams = useMemo(
    () => ({
      ...filters,
      cursor,
      limit: PAGE_LIMIT,
    }),
    [cursor, filters],
  )

  const updateFilters = useCallback(
    (nextFilters: CreatorsFilterParams) => {
      setCursor(undefined)
      void navigate({
        search: (previous) => ({
          ...previous,
          tab: 'creators',
          q: nextFilters.search,
          status: nextFilters.status,
          platform: nextFilters.platform,
        }),
      })
    },
    [navigate],
  )

  const updateTableParams = useCallback(
    (nextParams: CampaignParticipantsParams) => {
      setCursor(nextParams.cursor)
      const filtersChanged =
        nextParams.search !== filters.search ||
        nextParams.status !== filters.status ||
        nextParams.platform !== filters.platform

      if (!filtersChanged) return

      updateFilters({
        search: nextParams.search,
        status: nextParams.status,
        platform: nextParams.platform,
      })
    },
    [filters.platform, filters.search, filters.status, updateFilters],
  )

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters])
  const findCreators = useCallback(() => {
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: 'discovery',
        section: 'matches',
        q: undefined,
        status: undefined,
        platform: undefined,
      }),
    })
  }, [navigate])

  const handleInviteCreatorReady = useCallback(
    (openInviteCreator: (() => void) | null) => {
      openInviteCreatorRef.current = openInviteCreator
    },
    [],
  )

  const activeFilters = hasActiveFilters(filters)

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Creators`}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {t`Active creators in this campaign`}
          </h2>
        </div>
        <Button
          type="button"
          className="w-fit rounded-xl"
          onClick={() => openInviteCreatorRef.current?.()}
        >
          <Plus className="size-4" aria-hidden />
          {t`Invite creator`}
        </Button>
      </div>

      <CreatorsFilters params={filters} onParamsChange={updateFilters} />

      <CampaignCreatorsTable
        scope={{
          type: 'campaign',
          campaignId,
          allowsInPlatformInvites: planCapabilities.allows_in_platform_invites,
        }}
        params={tableParams}
        onParamsChange={updateTableParams}
        hasActiveFilters={activeFilters}
        onClearFilters={clearFilters}
        onFindCreators={findCreators}
        onInviteCreatorReady={handleInviteCreatorReady}
      />
    </section>
  )
}
