import { t } from '@lingui/core/macro'
import { BarChart3, Compass, LayoutGrid, Users, Video } from 'lucide-react'

import { CampaignWorkspaceTabs } from '#/features/campaigns/components/CampaignWorkspaceTabs'

export function getCampaignDetailTabs() {
  return [
    { id: 'overview', label: t`Overview`, icon: LayoutGrid },
    { id: 'discovery', label: t`Discovery`, icon: Compass },
    { id: 'creators', label: t`Creators`, icon: Users },
    { id: 'videos', label: t`Videos`, icon: Video },
    {
      id: 'analytics',
      label: t`Analytics`,
      icon: BarChart3,
      disabled: true,
      tooltip: t`Analytics todavía no está disponible para esta campaña.`,
    },
  ] as const
}

export type CampaignDetailTabId =
  | 'overview'
  | 'discovery'
  | 'creators'
  | 'videos'
  | 'analytics'

interface CampaignDetailTabsProps {
  activeTab: CampaignDetailTabId
  onTabChange: (tab: Exclude<CampaignDetailTabId, 'analytics'>) => void
}

export function CampaignDetailTabs({
  activeTab,
  onTabChange,
}: CampaignDetailTabsProps) {
  return (
    <nav
      aria-label={t`Secciones de campaña`}
      className="overflow-x-auto bg-background px-5 md:px-8"
    >
      <CampaignWorkspaceTabs
        tabs={[...getCampaignDetailTabs()]}
        activeId={activeTab}
        onSelect={(tab) => {
          if (!isCampaignDetailNavigableTab(tab)) return
          onTabChange(tab)
        }}
      />
    </nav>
  )
}

function isCampaignDetailNavigableTab(
  tab: string,
): tab is Exclude<CampaignDetailTabId, 'analytics'> {
  return (
    tab === 'overview' ||
    tab === 'discovery' ||
    tab === 'creators' ||
    tab === 'videos'
  )
}
