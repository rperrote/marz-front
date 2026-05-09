import { t } from '@lingui/core/macro'
import { AlertCircle, ClipboardList } from 'lucide-react'

import type { CampaignOverviewResponse } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

import { CreatorsPreview } from './overview/CreatorsPreview'
import { DetailsBlock } from './overview/DetailsBlock'
import { RecentActivity } from './overview/RecentActivity'
import { StatsBlock } from './overview/StatsBlock'
import { useCampaignOverviewQuery } from './useCampaignOverviewQuery'

interface OverviewTabProps {
  campaignId: string
}

export function OverviewTab({ campaignId }: OverviewTabProps) {
  const overviewQuery = useCampaignOverviewQuery(campaignId, {
    activityLimit: 5,
  })

  if (overviewQuery.isPending) {
    return <OverviewSkeleton />
  }

  if (overviewQuery.error) {
    return <OverviewError error={overviewQuery.error} />
  }

  return <OverviewContent overview={overviewQuery.data} />
}

function OverviewContent({ overview }: { overview: CampaignOverviewResponse }) {
  return (
    <div className="space-y-5">
      <StatsBlock overview={overview} />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="space-y-4">
          <DetailsBlock overview={overview} />
          <CreatorsPreview
            campaignId={overview.campaign.campaign_id}
            creators={overview.creators_preview}
          />
        </div>
        <RecentActivity
          campaignId={overview.campaign.campaign_id}
          activity={overview.recent_activity}
        />
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label={t`Cargando overview`}>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[116px] rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-3 w-24 rounded-full bg-muted" />
            <div className="mt-4 h-8 w-20 rounded-full bg-muted" />
            <div className="mt-3 h-3 w-28 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="space-y-4">
          <div className="h-64 rounded-2xl border border-border bg-card" />
          <div className="h-64 rounded-2xl border border-border bg-card" />
        </div>
        <div className="h-[360px] rounded-2xl border border-border bg-card" />
      </div>
    </div>
  )
}

function OverviewError({ error }: { error: Error }) {
  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <section className="rounded-2xl border border-border bg-card p-10 text-center">
      {isNotFound ? (
        <ClipboardList
          className="mx-auto size-9 text-muted-foreground"
          aria-hidden="true"
        />
      ) : (
        <AlertCircle
          className="mx-auto size-9 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        {isNotFound
          ? t`No encontramos el overview`
          : t`No pudimos cargar el overview`}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {isNotFound
          ? t`Puede que la campaña no exista o que no pertenezca a este workspace.`
          : t`Reintentá en unos minutos.`}
      </p>
    </section>
  )
}
