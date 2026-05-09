import { track } from '#/shared/analytics/track'

import type { BrandPaymentsSearch } from './api/brandPaymentsSchemas'

type BrandPaymentsPeriod = BrandPaymentsSearch['period']
type BrandPaymentsFilterName = 'campaign' | 'creator'

export function trackBrandPaymentsViewed(payload: {
  workspace_id: string
}): void {
  track('brand_payments_viewed', payload)
}

export function trackBrandPaymentsPeriodChanged(payload: {
  period: BrandPaymentsPeriod
}): void {
  track('brand_payments_period_changed', payload)
}

export function trackBrandPaymentsFilterChanged(payload: {
  filter: BrandPaymentsFilterName
  has_value: boolean
}): void {
  track('brand_payments_filter_changed', payload)
}

export function trackBrandPaymentsSearchUsed(payload: {
  query_length: number
}): void {
  track('brand_payments_search_used', payload)
}

export function trackBrandPaymentsCsvExported(payload: {
  workspace_id: string
  period: BrandPaymentsPeriod
  has_campaign_filter: boolean
  has_creator_filter: boolean
  has_search: boolean
}): void {
  track('brand_payments_csv_exported', payload)
}

export function trackBrandPaymentsRefreshClicked(payload: {
  workspace_id: string
}): void {
  track('brand_payments_refresh_clicked', payload)
}

export function trackBrandPaymentOpened(payload: {
  declared_payment_id: string
  conversation_id: string
}): void {
  track('brand_payment_opened', payload)
}
