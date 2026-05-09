import { t } from '@lingui/core/macro'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { ApiError } from '#/shared/api/mutator'

import {
  CampaignDetailHeader,
  CampaignDetailHeaderError,
  CampaignDetailHeaderSkeleton,
} from './CampaignDetailHeader'
import { CampaignDetailTabs } from './CampaignDetailTabs'
import type { CampaignDetailTabId } from './CampaignDetailTabs'
import { useCampaignDetailQuery } from './useCampaignDetailQuery'

export interface CampaignDetailSearch {
  tab: CampaignDetailTabId
  section?: 'matches' | 'invites' | 'applications'
  q?: string
  status?: string
  platform?: string
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
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })

  const handleTabChange = (tab: CampaignDetailNavigableTab) => {
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
      <CampaignDetailBody tab={search.tab} />
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

function CampaignDetailBody({ tab }: { tab: CampaignDetailTabId }) {
  const titleByTab: Record<CampaignDetailNavigableTab, string> = {
    overview: t`Overview`,
    discovery: t`Discovery`,
    creators: t`Creators`,
    videos: t`Videos`,
  }

  if (tab === 'analytics') {
    return (
      <BodyPlaceholder
        title={t`Analytics`}
        description={t`Esta sección todavía no está disponible.`}
      />
    )
  }

  return (
    <BodyPlaceholder
      title={titleByTab[tab]}
      description={t`El contenido de esta sección se completa en las próximas tasks.`}
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
