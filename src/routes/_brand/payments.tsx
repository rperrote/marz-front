import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { brandPaymentsSearchSchema } from '#/features/payments/api/brandPaymentsSchemas'
import type { BrandPaymentsSearch } from '#/features/payments/api/brandPaymentsSchemas'
import { BrandPaymentsPage } from '#/features/payments/components/BrandPaymentsPage'

export const paymentsSearchSchema = brandPaymentsSearchSchema

export const Route = createFileRoute('/_brand/payments')({
  validateSearch: paymentsSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.brandWorkspaceRole !== 'admin') {
      throw redirect({ to: '/workspace' })
    }
  },
  component: BrandPaymentsRoute,
})

function BrandPaymentsRoute() {
  const filters = Route.useSearch()
  const navigate = useNavigate()

  const handleFiltersChange = (nextFilters: BrandPaymentsSearch) => {
    void navigate({
      to: '/payments',
      search: {
        period: nextFilters.period,
        campaignId: nextFilters.campaignId,
        creatorId: nextFilters.creatorId,
        q: nextFilters.q,
      },
    })
  }

  return (
    <BrandPaymentsPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onOpenPayment={(row) => {
        void navigate({
          to: '/workspace/conversations/$conversationId',
          params: { conversationId: row.conversation_id },
          search: { filter: 'all' },
        })
      }}
    />
  )
}
