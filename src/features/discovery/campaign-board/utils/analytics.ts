import { track } from '#/shared/analytics/track'

import type { CampaignBoardEmptyStateType } from './classifyEmptyState'

export type CampaignBoardEventName =
  | 'campaign_board_viewed'
  | 'campaign_board_searched'
  | 'campaign_board_filtered'
  | 'campaign_board_sorted'
  | 'campaign_board_brief_opened'
  | 'campaign_board_application_started'
  | 'campaign_board_application_submitted'
  | 'campaign_board_empty_state_seen'

export interface CampaignBoardEventPayloads {
  campaign_board_viewed: {
    total_campaigns: number
    recommended_campaigns: number
  }
  campaign_board_searched: { has_query: boolean }
  campaign_board_filtered: {
    filter_types: string[]
    recommended_only: boolean
  }
  campaign_board_sorted: { sort_option: string }
  campaign_board_brief_opened: {
    match_score_range: string
    recommended: boolean
  }
  campaign_board_application_started: {
    match_score_range: string
    recommended: boolean
  }
  campaign_board_application_submitted: {
    match_score_range: string
    recommended: boolean
  }
  campaign_board_empty_state_seen: {
    empty_state_type: CampaignBoardEmptyStateType
  }
}

export function trackBoardEvent<TName extends CampaignBoardEventName>(
  name: TName,
  payload: CampaignBoardEventPayloads[TName],
): void {
  track(name, payload)
}
