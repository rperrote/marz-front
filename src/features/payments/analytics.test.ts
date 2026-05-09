import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as trackModule from '#/shared/analytics/track'

import {
  trackBrandPaymentsCsvExported,
  trackBrandPaymentOpened,
  trackBrandPaymentsFilterChanged,
  trackBrandPaymentsPeriodChanged,
  trackBrandPaymentsRefreshClicked,
  trackBrandPaymentsSearchUsed,
  trackBrandPaymentsViewed,
} from './analytics'

describe('payments analytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('routes brand payments events through shared analytics', () => {
    const spy = vi.spyOn(trackModule, 'track')

    trackBrandPaymentsViewed({ workspace_id: 'workspace-1' })
    trackBrandPaymentsPeriodChanged({ period: '90d' })
    trackBrandPaymentsFilterChanged({
      filter: 'campaign',
      has_value: true,
    })
    trackBrandPaymentsSearchUsed({ query_length: 3 })
    trackBrandPaymentsCsvExported({
      workspace_id: 'workspace-1',
      period: '30d',
      has_campaign_filter: false,
      has_creator_filter: true,
      has_search: false,
    })
    trackBrandPaymentsRefreshClicked({ workspace_id: 'workspace-1' })
    trackBrandPaymentOpened({
      declared_payment_id: '33333333-3333-4333-8333-333333333333',
      conversation_id: 'conversation-1',
    })

    expect(spy).toHaveBeenNthCalledWith(1, 'brand_payments_viewed', {
      workspace_id: 'workspace-1',
    })
    expect(spy).toHaveBeenNthCalledWith(2, 'brand_payments_period_changed', {
      period: '90d',
    })
    expect(spy).toHaveBeenNthCalledWith(3, 'brand_payments_filter_changed', {
      filter: 'campaign',
      has_value: true,
    })
    expect(spy).toHaveBeenNthCalledWith(4, 'brand_payments_search_used', {
      query_length: 3,
    })
    expect(spy).toHaveBeenNthCalledWith(5, 'brand_payments_csv_exported', {
      workspace_id: 'workspace-1',
      period: '30d',
      has_campaign_filter: false,
      has_creator_filter: true,
      has_search: false,
    })
    expect(spy).toHaveBeenNthCalledWith(6, 'brand_payments_refresh_clicked', {
      workspace_id: 'workspace-1',
    })
    expect(spy).toHaveBeenNthCalledWith(7, 'brand_payment_opened', {
      declared_payment_id: '33333333-3333-4333-8333-333333333333',
      conversation_id: 'conversation-1',
    })
  })
})
