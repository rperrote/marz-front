import { t } from '@lingui/core/macro'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { DiscoveryTab } from '#/features/discovery/campaign-detail/DiscoveryTab'
import { ListCampaignParticipantsStatus } from '#/shared/api/generated/model'
import type {
  CampaignPlanCapabilities,
  DeliverableStatus,
  ListCampaignParticipantsPlatform,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { trackDiscoverySectionViewed } from '#/shared/analytics/discoveryTracking'

import {
  CampaignDetailHeader,
  CampaignDetailHeaderError,
  CampaignDetailHeaderSkeleton,
} from './CampaignDetailHeader'
import { CampaignDetailTabs } from './CampaignDetailTabs'
import type { CampaignDetailTabId } from './CampaignDetailTabs'
import { OverviewTab } from './OverviewTab'
import { CreatorsTab } from './creators/CreatorsTab'
import { useCampaignDetailQuery } from './useCampaignDetailQuery'
import { VideosTab } from './videos/VideosTab'
import {
  isCampaignVideoPlatform,
  isCampaignVideoStatus,
} from './videos/VideosFilters'
import {
  trackCampaignDetailTabChanged,
  trackCampaignDetailViewed,
} from './tracking'
import { useCampaignTopicSubscription } from './useCampaignTopicSubscription'

export interface CampaignDetailSearch {
  tab: CampaignDetailTabId
  section: 'matches' | 'applications' | 'active' | 'invited'
  q?: string
  status?: ListCampaignParticipantsStatus | DeliverableStatus
  platform?: ListCampaignParticipantsPlatform
  creator_account_id?: string
  sort?: string
}

interface CampaignDetailPageProps {
  campaignId: string
  search: CampaignDetailSearch
}

type CampaignDetailNavigableTab = Exclude<CampaignDetailTabId, 'analytics'>

export function CampaignDetailPage({
  campaignId,
  search,
}: CampaignDetailPageProps) {
  const detailQuery = useCampaignDetailQuery(campaignId)
  useCampaignTopicSubscription(campaignId)
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })
  const lastTrackedDiscoverySectionRef = useRef<string | null>(null)

  useEffect(() => {
    trackCampaignDetailViewed(campaignId)
  }, [campaignId])

  useEffect(() => {
    if (search.tab !== 'discovery') return
    const sectionKey = `${campaignId}:${search.section}`
    if (lastTrackedDiscoverySectionRef.current === sectionKey) return
    lastTrackedDiscoverySectionRef.current = sectionKey
    trackDiscoverySectionViewed({
      campaignId,
      section: search.section,
    })
  }, [campaignId, search.section, search.tab])

  const handleTabChange = (tab: CampaignDetailNavigableTab) => {
    if (tab === search.tab) return
    trackCampaignDetailTabChanged({
      campaignId,
      from: search.tab,
      to: tab,
    })
    void navigate({
      search: (previous) => ({
        ...previous,
        tab,
      }),
    })
  }

  if (detailQuery.isPending) {
    return (
      <CampaignDetailShell
        header={<CampaignDetailHeaderSkeleton />}
        tab={search.tab}
        onTabChange={handleTabChange}
      >
        <BodyPlaceholder title={t`Cargando campaña`} />
      </CampaignDetailShell>
    )
  }

  if (detailQuery.error) {
    const isNotFound =
      detailQuery.error instanceof ApiError && detailQuery.error.status === 404

    return (
      <CampaignDetailShell
        header={<CampaignDetailHeaderError />}
        tab={search.tab}
        onTabChange={handleTabChange}
      >
        <EmptyState
          title={
            isNotFound
              ? t`No encontramos esta campaña`
              : t`No pudimos cargar la campaña`
          }
          description={
            isNotFound
              ? t`Puede que no exista o que no pertenezca a este workspace.`
              : t`Reintentá en unos minutos.`
          }
          action={
            <Button asChild variant="outline">
              <Link to="/campaigns">{t`Volver a campañas`}</Link>
            </Button>
          }
        />
      </CampaignDetailShell>
    )
  }

  return (
    <CampaignDetailShell
      header={<CampaignDetailHeader detail={detailQuery.data} />}
      tab={search.tab}
      onTabChange={handleTabChange}
    >
      <CampaignDetailBody
        campaignId={campaignId}
        tab={search.tab}
        search={search}
        planCapabilities={detailQuery.data.plan_capabilities}
      />
    </CampaignDetailShell>
  )
}

function CampaignDetailShell({
  header,
  tab,
  onTabChange,
  children,
}: {
  header: ReactNode
  tab: CampaignDetailTabId
  onTabChange: (tab: CampaignDetailNavigableTab) => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      {header}
      <CampaignDetailTabs activeTab={tab} onTabChange={onTabChange} />
      <main className="flex-1 bg-muted/30 px-5 py-5 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}

function CampaignDetailBody({
  campaignId,
  tab,
  search,
  planCapabilities,
}: {
  campaignId: string
  tab: CampaignDetailTabId
  search: CampaignDetailSearch
  planCapabilities: CampaignPlanCapabilities
}) {
  if (tab === 'analytics') {
    return (
      <BodyPlaceholder
        title={t`Analytics`}
        description={t`Esta sección todavía no está disponible.`}
      />
    )
  }

  if (tab === 'overview') {
    return <OverviewTab campaignId={campaignId} />
  }

  if (tab === 'discovery') {
    return (
      <DiscoveryTab
        campaignId={campaignId}
        planCapabilities={planCapabilities}
        search={search}
      />
    )
  }

  if (tab === 'creators') {
    return (
      <CreatorsTab
        campaignId={campaignId}
        planCapabilities={planCapabilities}
        search={{
          search: search.q,
          status: isCampaignParticipantStatus(search.status)
            ? search.status
            : undefined,
          platform: search.platform,
        }}
      />
    )
  }

  return (
    <VideosTab
      campaignId={campaignId}
      search={{
        search: search.q,
        status:
          search.status && isCampaignVideoStatus(search.status)
            ? search.status
            : undefined,
        platform:
          search.platform && isCampaignVideoPlatform(search.platform)
            ? search.platform
            : undefined,
        creator_account_id: search.creator_account_id,
      }}
    />
  )
}

function BodyPlaceholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <section className="min-h-[420px] rounded-2xl border border-border bg-card p-6">
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
        <ClipboardList
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-10 text-center">
      <AlertCircle
        className="mx-auto size-9 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

function isCampaignParticipantStatus(
  status: CampaignDetailSearch['status'],
): status is ListCampaignParticipantsStatus {
  return status ? Object.hasOwn(ListCampaignParticipantsStatus, status) : false
}
