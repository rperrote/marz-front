import { z } from 'zod'

export const brandPaymentsSearchSchema = z.object({
  period: z.enum(['30d', '90d', '12m', 'all']).default('30d'),
  campaignId: z.uuid().optional().catch(undefined),
  creatorId: z.uuid().optional().catch(undefined),
  q: z.string().max(100).optional().catch(undefined),
})

export const brandPaymentsSpendingInputSchema =
  brandPaymentsSearchSchema.extend({
    workspaceId: z.string().min(1),
    cursor: z.string().optional(),
  })

export const exportBrandPaymentsCsvInputSchema =
  brandPaymentsSearchSchema.extend({
    workspaceId: z.string().min(1),
  })

export type BrandPaymentsSearch = z.infer<typeof brandPaymentsSearchSchema>
export type BrandPaymentsSpendingInput = z.infer<
  typeof brandPaymentsSpendingInputSchema
>
export type ExportBrandPaymentsCsvInput = z.infer<
  typeof exportBrandPaymentsCsvInputSchema
>

export interface BrandPaymentsPeriod {
  value: BrandPaymentsSearch['period']
  start_at: string | null
  end_at: string
}

export interface BrandPaymentsNextDebit {
  amount: string
  date: string | null
  date_available: boolean
  source: 'payment_obligations'
}

export interface BrandPaymentsSummary {
  total_spent: string
  period_spend: string
  pending_approval: string
  next_debit: BrandPaymentsNextDebit
}

export interface BrandPaymentsMonthlySpend {
  month: string
  amount: string
}

export interface BrandPaymentsCampaignBreakdown {
  campaign_id: string | null
  campaign_name: string
  amount: string
  percentage: string
  bucket: 'campaign' | 'others'
}

export interface BrandPaymentsCampaignFilter {
  campaign_id: string
  campaign_name: string | null
}

export interface BrandPaymentsCreatorFilter {
  creator_account_id: string
  display_name: string | null
  handle: string | null
}

export interface BrandPaymentHistoryRow {
  id: string
  declared_at: string
  creator: {
    account_id: string
    display_name: string | null
    handle: string | null
  }
  campaign: { id: string; name: string | null }
  deliverable: {
    id: string
    label: string
    platform: string
    format: string
  }
  amount: string
  conversation_id: string
  highlight: { kind: 'payment'; id: string }
}

export interface BrandPaymentsFilters {
  campaigns: BrandPaymentsCampaignFilter[]
  creators: BrandPaymentsCreatorFilter[]
}

export interface BrandPaymentsPageData {
  data: BrandPaymentHistoryRow[]
  next_cursor: string | null
  total_visible: number
}

export interface BrandPaymentsSpendingResponse {
  brand_workspace_id: string
  period: BrandPaymentsPeriod
  summary: BrandPaymentsSummary
  monthly_spend: BrandPaymentsMonthlySpend[]
  campaign_breakdown: BrandPaymentsCampaignBreakdown[]
  filters: BrandPaymentsFilters
  payments: BrandPaymentsPageData
}

export function normalizeBrandPaymentsFilters(
  filters: BrandPaymentsSearch,
): BrandPaymentsSearch {
  const query = filters.q?.trim()

  return {
    period: filters.period,
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
    ...(query ? { q: query } : {}),
  }
}

export function toBrandPaymentsQueryParams(
  input: BrandPaymentsSearch & { cursor?: string },
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('period', input.period)
  if (input.campaignId) params.set('campaign_id', input.campaignId)
  if (input.creatorId) params.set('creator_account_id', input.creatorId)
  if (input.q) params.set('q', input.q)
  if (input.cursor) params.set('cursor', input.cursor)
  return params
}
