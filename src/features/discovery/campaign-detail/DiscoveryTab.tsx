import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, ChevronDown, Loader2, Plus, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

import type { CampaignPlanCapabilities } from '#/shared/api/generated/model'

import { AddCreatorDialog } from './AddCreatorDialog'
import { ActiveCollaborationList } from './ActiveCollaborationList'
import { ApplicationCard } from './ApplicationCard'
import { DiscoverySidebar } from './DiscoverySidebar'
import { InviteList } from './InviteList'
import { MatchCard } from './MatchCard'
import {
  isDiscoverySort,
  normalizeDiscoverySort,
  useCampaignActiveQuery,
  useCampaignApplicationsQuery,
  useCampaignDiscoverySummaryQuery,
  useCampaignInvitesQuery,
  useCampaignMatchesQuery,
} from './queries'
import type { DiscoverySection, DiscoverySort } from './queries'

interface DiscoveryTabProps {
  campaignId: string
  planCapabilities: CampaignPlanCapabilities
  search: {
    section: DiscoverySection
    sort?: string
  }
}

export function DiscoveryTab({
  campaignId,
  planCapabilities,
  search,
}: DiscoveryTabProps) {
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })
  const summaryQuery = useCampaignDiscoverySummaryQuery(campaignId)
  const section = search.section
  const sort = normalizeDiscoverySort(search.sort, section) ?? 'match_score'

  const handleSectionChange = (nextSection: DiscoverySection) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: 'discovery',
        section: nextSection,
        sort: nextSection === 'matches' ? previous.sort : undefined,
      }),
    })
  }

  const handleSortChange = (nextSort: DiscoverySort) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: 'discovery',
        section: 'matches',
        sort: nextSort,
      }),
    })
  }

  return (
    <section className="flex flex-col gap-5 md:flex-row">
      <DiscoverySidebar
        summary={summaryQuery.data}
        activeSection={section}
        onSectionChange={handleSectionChange}
        isLoading={summaryQuery.isPending}
      />
      <div className="min-w-0 flex-1">
        {summaryQuery.error ? (
          <SectionError title={t`No pudimos cargar el resumen de Discovery`} />
        ) : null}
        {section === 'matches' ? (
          <MatchesSection
            campaignId={campaignId}
            sort={sort}
            canViewMatches={summaryQuery.data?.availability.can_view_matches}
            summaryReady={!summaryQuery.isPending}
            onSortChange={handleSortChange}
          />
        ) : null}
        {section === 'applications' ? (
          <ApplicationsSection campaignId={campaignId} />
        ) : null}
        {section === 'invited' ? (
          <InvitesSection
            campaignId={campaignId}
            planCapabilities={planCapabilities}
          />
        ) : null}
        {section === 'active' ? (
          <ActiveSection campaignId={campaignId} />
        ) : null}
      </div>
    </section>
  )
}

function MatchesSection({
  campaignId,
  sort,
  canViewMatches,
  summaryReady,
  onSortChange,
}: {
  campaignId: string
  sort: DiscoverySort
  canViewMatches: boolean | undefined
  summaryReady: boolean
  onSortChange: (sort: DiscoverySort) => void
}) {
  const matchesQuery = useCampaignMatchesQuery({
    campaignId,
    sort,
    enabled: summaryReady && canViewMatches !== false,
  })
  const matches = matchesQuery.data?.pages.flatMap((page) => page.data) ?? []

  if (!summaryReady) {
    return (
      <SectionFrame
        title={t`Suggested matches`}
        description={t`Cargando resumen de Discovery`}
        action={<SortSelect value={sort} onValueChange={onSortChange} />}
      >
        <SectionSkeleton />
      </SectionFrame>
    )
  }

  if (!canViewMatches) {
    return (
      <EmptyState
        title={t`Matches no disponibles`}
        description={t`El plan o estado de esta campaña todavía no permite ver sugerencias automáticas.`}
      />
    )
  }

  return (
    <SectionFrame
      title={t`Suggested matches`}
      description={t`${matches.length} creators match your campaign brief`}
      action={<SortSelect value={sort} onValueChange={onSortChange} />}
    >
      <QueryState
        isLoading={matchesQuery.isPending}
        isError={matchesQuery.isError}
        isEmpty={matches.length === 0}
        emptyTitle={t`Todavía no hay matches sugeridos`}
        emptyDescription={t`Cuando el brief tenga perfiles compatibles, van a aparecer en esta lista.`}
      >
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.match_id}
              campaignId={campaignId}
              match={match}
            />
          ))}
        </div>
        <LoadMore
          hasNextPage={matchesQuery.hasNextPage}
          isFetchingNextPage={matchesQuery.isFetchingNextPage}
          onLoadMore={() => void matchesQuery.fetchNextPage()}
        />
      </QueryState>
    </SectionFrame>
  )
}

function ApplicationsSection({ campaignId }: { campaignId: string }) {
  const applicationsQuery = useCampaignApplicationsQuery(campaignId)
  const applications =
    applicationsQuery.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <SectionFrame
      title={t`Applicants`}
      description={t`${applications.length} creators applied to this campaign`}
    >
      <QueryState
        isLoading={applicationsQuery.isPending}
        isError={applicationsQuery.isError}
        isEmpty={applications.length === 0}
        emptyTitle={t`Todavía no hay aplicaciones`}
        emptyDescription={t`Las postulaciones entrantes van a aparecer acá.`}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {applications.map((application) => (
            <ApplicationCard
              key={application.application_id}
              campaignId={campaignId}
              application={application}
            />
          ))}
        </div>
        <LoadMore
          hasNextPage={applicationsQuery.hasNextPage}
          isFetchingNextPage={applicationsQuery.isFetchingNextPage}
          onLoadMore={() => void applicationsQuery.fetchNextPage()}
        />
      </QueryState>
    </SectionFrame>
  )
}

function InvitesSection({
  campaignId,
  planCapabilities,
}: {
  campaignId: string
  planCapabilities: CampaignPlanCapabilities
}) {
  const [addCreatorOpen, setAddCreatorOpen] = useState(false)
  const invitesQuery = useCampaignInvitesQuery(campaignId)
  const invites = invitesQuery.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <>
      <SectionFrame
        title={t`Invited creators`}
        description={t`${invites.length} invitations sent`}
        action={
          <Button
            type="button"
            size="sm"
            onClick={() => setAddCreatorOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {t`Add manually`}
          </Button>
        }
      >
        <QueryState
          isLoading={invitesQuery.isPending}
          isError={invitesQuery.isError}
          isEmpty={invites.length === 0}
          emptyTitle={t`Todavía no hay invitaciones`}
          emptyDescription={t`Las invitaciones creadas para esta campaña van a aparecer acá.`}
        >
          <InviteList invites={invites} />
          <LoadMore
            hasNextPage={invitesQuery.hasNextPage}
            isFetchingNextPage={invitesQuery.isFetchingNextPage}
            onLoadMore={() => void invitesQuery.fetchNextPage()}
          />
        </QueryState>
      </SectionFrame>
      <AddCreatorDialog
        campaignId={campaignId}
        open={addCreatorOpen}
        onOpenChange={setAddCreatorOpen}
        allowsInPlatformInvites={planCapabilities.allows_in_platform_invites}
      />
    </>
  )
}

function ActiveSection({ campaignId }: { campaignId: string }) {
  const activeQuery = useCampaignActiveQuery(campaignId)
  const collaborations =
    activeQuery.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <SectionFrame
      title={t`Active collaborations`}
      description={t`${collaborations.length} creators are active`}
    >
      <QueryState
        isLoading={activeQuery.isPending}
        isError={activeQuery.isError}
        isEmpty={collaborations.length === 0}
        emptyTitle={t`Todavía no hay colaboraciones activas`}
        emptyDescription={t`Cuando aceptes una aplicación o invitación, el creator va a aparecer acá.`}
      >
        <ActiveCollaborationList collaborations={collaborations} />
        <LoadMore
          hasNextPage={activeQuery.hasNextPage}
          isFetchingNextPage={activeQuery.isFetchingNextPage}
          onLoadMore={() => void activeQuery.fetchNextPage()}
        />
      </QueryState>
    </SectionFrame>
  )
}

function SectionFrame({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function SortSelect({
  value,
  onValueChange,
}: {
  value: DiscoverySort
  onValueChange: (value: DiscoverySort) => void
}) {
  const sortLabels: Record<DiscoverySort, string> = {
    match_score: t`Match score`,
    followers: t`Followers`,
    fee: t`Fee`,
    engagement: t`Engagement`,
  }

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (isDiscoverySort(nextValue)) {
          onValueChange(nextValue)
        }
      }}
    >
      <SelectTrigger
        className="h-9 rounded-xl bg-background"
        aria-label={t`Ordenar matches`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(sortLabels).map(([sort, label]) => {
          return (
            <SelectItem key={sort} value={sort}>
              {label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function QueryState({
  isLoading,
  isError,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  children: ReactNode
}) {
  if (isLoading) return <SectionSkeleton />
  if (isError) return <SectionError title={t`No pudimos cargar esta sección`} />
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return children
}

function SectionSkeleton() {
  return (
    <div
      className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label={t`Cargando discovery`}
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[520px] rounded-2xl border border-border bg-card p-3"
        >
          <div className="h-[420px] rounded-xl bg-muted" />
          <div className="mt-4 h-3 w-3/4 rounded-full bg-muted" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Search className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function SectionError({ title }: { title: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <AlertCircle className="size-4 text-destructive" aria-hidden />
        {title}
      </div>
      <p className="mt-1">{t`Reintentá en unos minutos.`}</p>
    </div>
  )
}

function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}) {
  if (!hasNextPage) return null

  return (
    <div className="mt-5 flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLoadMore}
        disabled={isFetchingNextPage}
      >
        {isFetchingNextPage ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden />
        )}
        {t`Cargar más`}
      </Button>
    </div>
  )
}
