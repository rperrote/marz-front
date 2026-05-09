import { track } from '#/shared/analytics/track'

import type { CampaignDetailTabId } from './CampaignDetailTabs'

type CampaignDetailNavigableTab = Exclude<CampaignDetailTabId, 'analytics'>
export type DiscoverySection = 'matches' | 'applications' | 'active' | 'invited'

export function trackCampaignDetailViewed(campaignId: string) {
  track('campaign_detail_viewed', {
    campaign_id: campaignId,
  })
}

export function trackCampaignDetailTabChanged({
  campaignId,
  from,
  to,
}: {
  campaignId: string
  from: CampaignDetailTabId
  to: CampaignDetailNavigableTab
}) {
  track('campaign_detail_tab_changed', {
    campaign_id: campaignId,
    from,
    to,
  })
}
