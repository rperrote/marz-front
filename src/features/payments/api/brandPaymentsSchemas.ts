import { z } from 'zod'

export const brandPaymentsSearchSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  campaignId: z.string().optional(),
  creatorId: z.string().optional(),
  q: z.string().optional(),
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

export interface BrandPaymentsMoney {
  amount: string
  currency: string
}

export interface BrandPaymentsSpendingKpi {
  key: string
  label: string
  value: BrandPaymentsMoney
  delta_pct?: number | null
}

export interface BrandPaymentsSpendingRow {
  id: string
  creator_id: string
  creator_name: string
  campaign_id: string | null
  campaign_name: string | null
  amount: BrandPaymentsMoney
  paid_at: string
  deliverable_id?: string | null
}

export interface BrandPaymentsSpendingResponse {
  kpis: BrandPaymentsSpendingKpi[]
  rows: BrandPaymentsSpendingRow[]
  next_cursor?: string | null
}

export function normalizeBrandPaymentsFilters(
  filters: BrandPaymentsSearch,
): BrandPaymentsSearch {
  return {
    period: filters.period,
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
    ...(filters.q ? { q: filters.q } : {}),
  }
}

export function toBrandPaymentsQueryParams(
  input: BrandPaymentsSearch & { cursor?: string },
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('period', input.period)
  if (input.campaignId) params.set('campaignId', input.campaignId)
  if (input.creatorId) params.set('creatorId', input.creatorId)
  if (input.q) params.set('q', input.q)
  if (input.cursor) params.set('cursor', input.cursor)
  return params
}
