import { track } from '#/shared/analytics/track'

export type DiscoverySection = 'matches' | 'applications' | 'active' | 'invited'
type DiscoveryInviteMode = 'email' | 'in_platform'

export function trackDiscoverySectionViewed({
  campaignId,
  section,
}: {
  campaignId: string
  section: DiscoverySection
}) {
  track('discovery_section_viewed', {
    campaign_id: campaignId,
    section,
  })
}

export function trackDiscoveryMatchContacted({
  campaignId,
  mode,
}: {
  campaignId: string
  mode?: DiscoveryInviteMode
}) {
  track('discovery_match_contacted', {
    campaign_id: campaignId,
    mode: mode ?? 'conversation',
  })
}

export function trackDiscoveryApplicationDecided({
  campaignId,
  decision,
}: {
  campaignId: string
  decision: 'accept' | 'reject'
}) {
  track('discovery_application_decided', {
    campaign_id: campaignId,
    decision,
  })
}

export function trackDiscoveryInviteCreated({
  campaignId,
  mode,
}: {
  campaignId: string
  mode: DiscoveryInviteMode
}) {
  track('discovery_invite_created', {
    campaign_id: campaignId,
    mode,
  })
}
