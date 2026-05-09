import { t } from '@lingui/core/macro'
import { CircleAlert, Inbox, Send, Sparkles, Users } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { CampaignDiscoverySummaryResponse } from '#/shared/api/generated/model'

import type { DiscoverySection } from './queries'

interface DiscoverySidebarProps {
  summary: CampaignDiscoverySummaryResponse | undefined
  activeSection: DiscoverySection
  onSectionChange: (section: DiscoverySection) => void
  isLoading: boolean
}

export function DiscoverySidebar({
  summary,
  activeSection,
  onSectionChange,
  isLoading,
}: DiscoverySidebarProps) {
  const availability = summary?.availability
  const sectionItems = getSectionItems()

  return (
    <aside className="w-full shrink-0 md:w-[200px]" aria-label={t`Discovery`}>
      <div className="md:sticky md:top-5">
        <p className="px-2 pb-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          {t`Creators`}
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {sectionItems.map((item) => (
            <SectionButton
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              count={summary ? getCount(summary, item.id) : undefined}
              active={activeSection === item.id}
              isLoading={isLoading}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </nav>
        {availability?.message ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <CircleAlert className="size-3.5 text-primary" aria-hidden />
              {availability.can_view_matches
                ? t`Discovery disponible`
                : t`Discovery limitado`}
            </div>
            <p>{availability.message}</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function getSectionItems() {
  return [
    { id: 'matches', label: t`Matches`, icon: Sparkles },
    { id: 'applications', label: t`Applicants`, icon: Inbox },
    { id: 'invited', label: t`Invited`, icon: Send },
    { id: 'active', label: t`Active`, icon: Users },
  ] as const
}

function SectionButton({
  id,
  label,
  icon: Icon,
  count,
  active,
  isLoading,
  onClick,
}: {
  id: DiscoverySection
  label: string
  icon: typeof Sparkles
  count: number | undefined
  active: boolean
  isLoading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-9 min-w-36 items-center gap-2 rounded-xl px-2.5 text-left text-sm transition-colors md:min-w-0',
        active
          ? 'bg-muted text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={cn(
          'rounded-lg px-1.5 py-0.5 font-mono text-[11px]',
          active
            ? 'bg-background text-primary'
            : 'bg-muted text-muted-foreground',
        )}
        aria-label={t`${label}: ${count ?? 0}`}
      >
        {isLoading ? '...' : (count ?? 0)}
      </span>
      <span className="sr-only">{id}</span>
    </button>
  )
}

function getCount(
  summary: CampaignDiscoverySummaryResponse,
  section: DiscoverySection,
) {
  const counts: Record<DiscoverySection, number> = {
    matches: summary.counts.matches,
    applications: summary.counts.applications,
    invited: summary.counts.invited,
    active: summary.counts.active,
  }

  return counts[section]
}
